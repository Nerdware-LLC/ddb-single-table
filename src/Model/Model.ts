import { isArray } from "@nerdware/ts-type-safety-utils";
import { DdbClientWrapper } from "../DdbClientWrapper/index.js";
import { generateUpdateExpression, convertWhereQueryToSdkQueryArgs } from "../Expressions/index.js";
import { ModelSchema } from "../Schema/ModelSchema.js";
import { ItemInputError } from "../utils/errors.js";
import { ioActions } from "./ioActions/ioActions.js";
import type { EnabledIOActions, IOAction, IOActionContext } from "./ioActions/types.js";
import type {
  ModelConstructorParams,
  AttributesAliasesMap,
  KeyParameters,
  GetItemOpts,
  BatchGetItemsOpts,
  CreateItemOpts,
  UpsertItemOpts,
  UpdateItemOpts,
  DeleteItemOpts,
  BatchWriteItemsOpts,
  QueryOpts,
  ScanOpts,
} from "./types/index.js";
import type {
  ModelSchemaType,
  ModelSchemaAttributeConfig,
  ModelSchemaOptions,
  ModelSchemaEntries,
} from "../Schema/types/index.js";
import type { TableKeysAndIndexes } from "../Table/types/index.js";
import type {
  BaseItem,
  ItemKeys,
  ItemTypeFromSchema,
  ItemCreationParameters,
  ItemUpdateParameters,
  NativeAttributeValue,
} from "../types/index.js";
import type { SetOptional } from "type-fest";

/**
 * Each Model instance is provided with CRUD methods featuring parameter and return types which
 * reflect the Model's schema. Model methods wrap `DynamoDBClient` command operations with sets
 * of schema-aware middleware called {@link ioActions|"IO-Actions"} which provide rich functionality
 * for database-IO like alias mapping, value validation, user-defined transforms, etc.
 *
 * IO-Actions are grouped into two sets based on the request-response cycle:
 * - **`toDB`**: IO-Actions performed on _request arguments_.
 * - **`fromDB`**: IO-Actions performed on _response values_.
 *
 * The IO-Actions undertaken for each set are listed below in order of execution. Note that some
 * IO-Actions are skipped by certain methods, depending on the method's purpose. For example, item
 * values provided to `Model.updateItem` are not subjected to `"required"` checks, since the method
 * is intended to update individual properties of existing items.
 * _See **{@link ioActions|IO-Actions}** for more info an any of the IO-Actions listed below._
 *
 * **`toDB`**:
 *   1. **`Alias Mapping`** — Replaces "alias" keys with attribute names.
 *   2. **`Set Defaults`** — Applies defaults defined in the schema.
 *   3. **`Attribute toDB Modifiers`** — Runs your `transformValue.toDB` fns.
 *   4. **`Item toDB Modifier`** — Runs your `transformItem.toDB` fn.
 *   5. **`Type Checking`** — Checks properties for conformance with their `"type"`.
 *   6. **`Attribute Validation`** — Validates individual item properties.
 *   7. **`Item Validation`** — Validates an item in its entirety.
 *   8. **`Convert JS Types`** — Converts JS types into DynamoDB types.
 *   9. **`"Required" Checks`** — Checks for `"required"` and `"nullable"` attributes.
 *
 * **`fromDB`**:
 *   1. **`Convert JS Types`** — Converts DynamoDB types into JS types.
 *   2. **`Attribute fromDB Modifiers`** — Runs your `transformValue.fromDB` fns.
 *   3. **`Item fromDB Modifier`** — Runs your `transformItem.fromDB` fn.
 *   4. **`Alias Mapping`** — Replaces attribute names with "alias" keys.
 *
 * #### Ordering of Attributes
 * IO-Actions which process individual attributes always process attributes in the same order:
 *   1. The table hash key is always processed first.
 *   2. The table sort key is always processed second.
 *   3. Any index PKs are processed after the table SK.
 *   4. All other attributes are then processed in the order they are defined in the schema.
 *
 * Aside from ensuring predictable execution, this consistency also opens up design opportunities
 * for your schema. For example, if you have a schema which uses a function to dynamically generate
 * a default value for an `id` attribute which is used as the table hash key, other non-key
 * attributes may be defined using the item's generated `id` value.
 *
 * @template Schema - The Model's readonly schema.
 * @template ItemType - A type which reflects a complete instance of a Model item.
 * @template ItemCreationParams - The parameters used to create a new item instance.
 */
export class Model<
  const Schema extends ModelSchemaType,
  const ItemType extends BaseItem = ItemTypeFromSchema<Schema>,
  const ItemCreationParams extends BaseItem = ItemCreationParameters<Schema>,
> implements TableKeysAndIndexes
{
  // INSTANCE PROPERTIES:
  readonly modelName: string;
  readonly schema: Schema;
  readonly schemaEntries: ModelSchemaEntries;
  readonly schemaOptions: ModelSchemaOptions;
  readonly schemaWithKeysOnly: Record<string, ModelSchemaAttributeConfig>;
  readonly attributesToAliasesMap: AttributesAliasesMap;
  readonly aliasesToAttributesMap: AttributesAliasesMap;
  readonly tableName: string;
  readonly tableHashKey: TableKeysAndIndexes["tableHashKey"];
  readonly tableRangeKey?: TableKeysAndIndexes["tableRangeKey"];
  readonly indexes?: TableKeysAndIndexes["indexes"];
  /** A wrapper-class around the DynamoDB client instance which greatly simplifies DDB operations. */
  readonly ddb: DdbClientWrapper;

  constructor(
    /** The name of the Model. */
    modelName: string,
    /** The Model's {@link Schema}. */
    modelSchema: Schema,
    /** {@link ModelSchemaOptions} and table key/index properties. */
    {
      tableName,
      tableHashKey,
      tableRangeKey,
      indexes,
      ddb: ddbClientWrapper,
      autoAddTimestamps = ModelSchema.DEFAULT_OPTIONS.autoAddTimestamps,
      allowUnknownAttributes = ModelSchema.DEFAULT_OPTIONS.allowUnknownAttributes,
      transformItem,
      validateItem,
    }: ModelConstructorParams
  ) {
    // Validate the Model schema and obtain the Model's alias maps
    const { attributesToAliasesMap, aliasesToAttributesMap } = ModelSchema.validate(modelSchema, {
      name: `${modelName} Model schema`,
    });

    this.modelName = modelName;
    this.schema = {
      ...modelSchema,
      ...(autoAddTimestamps && ModelSchema.TIMESTAMP_ATTRIBUTES),
    };
    this.schemaOptions = {
      autoAddTimestamps,
      allowUnknownAttributes,
      ...(transformItem && { transformItem }),
      ...(validateItem && { validateItem }),
    };
    this.schemaWithKeysOnly = {
      [tableHashKey]: this.schema[tableHashKey],
      ...(!!tableRangeKey && { [tableRangeKey]: this.schema[tableRangeKey] }),
    };

    this.attributesToAliasesMap = attributesToAliasesMap;
    this.aliasesToAttributesMap = aliasesToAttributesMap;
    this.tableName = tableName;
    this.tableHashKey = tableHashKey;
    this.tableRangeKey = tableRangeKey;
    this.indexes = indexes;
    this.ddb = ddbClientWrapper;

    // Cache sorted schema entries for IO-Actions
    this.schemaEntries = ModelSchema.getSortedSchemaEntries(modelSchema, {
      tableHashKey,
      ...(tableRangeKey && { tableRangeKey }),
      ...(indexes && { indexes }),
    });
  }

  /**
   * [`GetItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
   *
   * @param primaryKeys The primary keys of the item to get.
   * @param getItemOpts Options for the underlying `GetItem` operation.
   * @returns The item, if found.
   */
  readonly getItem = async (
    primaryKeys: KeyParameters<Schema>,
    getItemOpts: GetItemOpts = {}
  ): Promise<ItemType | undefined> => {
    const unaliasedKeys = this.processKeyArgs(primaryKeys);

    const response = await this.ddb.getItem({
      ...getItemOpts,
      Key: unaliasedKeys,
    });

    if (response.Item) {
      return this.processItemAttributes.fromDB<ItemType>(response.Item);
    }
  };

  /**
   * [`BatchGetItem`][api-ref] operation wrapper.
   *
   * - **Max Chunk Size**: The provided `primaryKeys` are spliced into chunks of 100 (the maximum
   *   limit set by AWS for BatchGetItem requests).
   *
   * - **Automatic Retries**: Per AWS recommendations, BatchGetItem requests which either return
   *   `UnprocessedKeys` or result in a retryable error are automatically retried using an
   *   exponential backoff strategy which adheres to AWS best practices.
   *
   * - **Unprocessed Keys**: Any `UnprocessedKeys` returned by the batch request are re-submitted.
   *
   * - **Exponential Backoff**: All retries are implemented with an exponential backoff strategy:
   *   1. First request: no delay
   *   2. Second request: delay `initialDelay` milliseconds (default: 100)
   *   3. All subsequent request delays are equal to the previous delay multiplied by the
   *      `timeMultiplier` (default: 2), until either:
   *      - The `maxRetries` limit is reached (default: 10), or
   *      - The `maxDelay` limit is reached (default: 3500, or 3.5 seconds)
   *
   *      Ergo, the base `delay` calculation can be summarized as follows:
   *      > `initialDelay * timeMultiplier^attemptNumber milliseconds`
   *
   *      If `useJitter` is true (default: false), the `delay` is randomized by applying the following
   *      to the base `delay`: `Math.round( Math.random() * delay )`. Note that the determination as
   *      to whether the delay exceeds the `maxDelay` is made BEFORE the jitter is applied.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   *
   * @param primaryKeys The primary keys of the items to get.
   * @param batchGetItemsOpts Options for the underlying `BatchGetItem` operation.
   * @returns The items, if found.
   * @throws {ItemInputError} If `primaryKeys` is not an array.
   */
  readonly batchGetItems = async (
    primaryKeys: Array<KeyParameters<Schema>>,
    batchGetItemsOpts: BatchGetItemsOpts = {}
  ): Promise<Array<ItemType> | undefined> => {
    // Safety-check: throw error if `primaryKeys` is not an array
    if (!isArray(primaryKeys))
      throw new ItemInputError(`[batchGetItems] The "primaryKeys" parameter must be an array.`);

    const unaliasedKeys: Array<ItemKeys> = primaryKeys.map((pks) => this.processKeyArgs(pks));

    const response = await this.ddb.batchGetItems({
      ...batchGetItemsOpts,
      RequestItems: {
        [this.tableName]: {
          Keys: unaliasedKeys,
        },
      },
    });

    return response.Responses?.[this.tableName]?.map((item) =>
      this.processItemAttributes.fromDB(item)
    );
  };

  /**
   * A [`PutItem`][api-ref] operation wrapper which guarantees existing items will not be
   * overwritten by always including a [`ConditionExpression` which checks for the non-existence
   * of the item's hash key][ddb-docs-conditional-put].
   *
   * If the Model's `schemaOptions` are configured to auto-add timestamps, this method will also add
   * a `createdAt` attribute (or the `attrName` specified for the custom timestamp attribute) set to
   * the current timestamp.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   * [ddb-docs-conditional-put]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html#Expressions.ConditionExpressions.PreventingOverwrites
   *
   * @param item The item to create.
   * @param createItemOpts Options for the underlying `PutItem` operation.
   * @returns The provided `item` with any schema-defined defaults and transforms applied.
   */
  readonly createItem = async (
    item: ItemCreationParams,
    createItemOpts: CreateItemOpts = {}
  ): Promise<ItemType> => {
    // Process `item`, and add timestamps if `autoAddTimestamps` is enabled
    const toDBitem = this.processItemAttributes.toDB({
      ...(this.schemaOptions.autoAddTimestamps && {
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      ...item,
    });

    /* The `ReturnValues` param for PutItem can only be "NONE" or "ALL_OLD", so DDB
    will never return anything here where PutItem is used to create a new item.  */
    await this.ddb.putItem({
      ...createItemOpts,
      Item: toDBitem,
      ConditionExpression: `attribute_not_exists(${this.tableHashKey})`,
      /* Note that appending "AND attribute_not_exists(sk)" to the above ConditionExpression
      would be superfluous, since PutItem operations are conducted by first finding an Item with
      the specified Item's keys, and THEN it applies the ConditionExpression if it finds one. */
    });

    /* Since the above PutItem operation will never return anything, `processItemAttributes.fromDB`
    is called with the `toDBitem` to return an item with schema-defined defaults and transforms. */
    return this.processItemAttributes.fromDB<ItemType>(toDBitem);
  };

  /**
   * A [`PutItem`][api-ref] operation wrapper which will either update an existing item or
   * create a new one if an item with the specified keys does not yet exist.
   *
   * > This method will overwrite an existing item with the specified keys if one exists.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   *
   * @param item The item to upsert.
   * @param upsertItemOpts Options for the underlying `PutItem` operation.
   * @returns The provided `item` with any schema-defined defaults and transforms applied.
   */
  readonly upsertItem = async (
    item: ItemCreationParams,
    upsertItemOpts: UpsertItemOpts = {}
  ): Promise<ItemType> => {
    // Process `item`, and add timestamps if `autoAddTimestamps` is enabled
    const toDBitem = this.processItemAttributes.toDB({
      ...(this.schemaOptions.autoAddTimestamps && {
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      ...item,
    });

    await this.ddb.putItem({
      ...upsertItemOpts,
      Item: toDBitem,
    });

    return this.processItemAttributes.fromDB<ItemType>(toDBitem);
  };

  /**
   * A [`BatchWriteItem`][api-ref] operation wrapper optimized for upserting items.
   *
   * > Note: `BatchWriteItem` does not support condition expressions.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   *
   * @param items The items to upsert.
   * @param batchUpsertItemsOpts Options for the underlying `BatchWriteItem` operation.
   * @throws {ItemInputError} If `items` is not an array.
   * @returns The provided `items` with any schema-defined defaults and transformations applied.
   */
  readonly batchUpsertItems = async (
    items: Array<ItemCreationParams>,
    batchUpsertItemsOpts: BatchWriteItemsOpts = {}
  ): Promise<Array<ItemType>> => {
    const { upsertItems = [] } = await this.batchUpsertAndDeleteItems(
      { upsertItems: items },
      batchUpsertItemsOpts
    );

    return upsertItems;
  };

  /**
   * [`UpdateItem`][api-ref] operation wrapper. This method uses the `update` param to generate the
   * following `UpdateItem` arguments:
   *
   * - `UpdateExpression` (may include `"SET"` and/or `"REMOVE"` clauses)
   * - `ExpressionAttributeNames`
   * - `ExpressionAttributeValues`
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   *
   * @param primaryKeys The primary keys of the item to update.
   * @param updateItemOpts The `update` object and options for the underlying `UpdateItem` operation.
   * @returns The updated item with new/updated values.
   */
  readonly updateItem = async (
    primaryKeys: KeyParameters<Schema>,
    {
      update,
      updateOptions,
      ...updateItemOpts
    }: UpdateItemOpts<ItemUpdateParameters<ItemCreationParams>>
  ): Promise<ItemType> => {
    // Process `update`, and add `updatedAt` timestamp if `autoAddTimestamps` is enabled
    const toDBupdateAttributes = this.processItemAttributes.toDB(
      {
        ...update,
        ...(this.schemaOptions.autoAddTimestamps && { updatedAt: new Date() }),
      },
      {
        aliasMapping: true,
        setDefaults: false, // disabled
        transformValues: true,
        transformItem: false, // disabled
        typeChecking: true,
        validate: true,
        validateItem: false, // disabled
        convertJsTypes: true,
        checkRequired: false, // disabled
      }
    );

    // Generate the `UpdateExpression` and `ExpressionAttribute{Names,Values}`
    const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      generateUpdateExpression(toDBupdateAttributes, updateOptions);

    const unaliasedKeys = this.processKeyArgs(primaryKeys);

    const response = await this.ddb.updateItem({
      ...updateItemOpts,
      Key: unaliasedKeys,
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW", // <-- ensures the response contains `Attributes`
    });

    return this.processItemAttributes.fromDB<ItemType>(response.Attributes!);
  };

  /**
   * [`DeleteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   *
   * @param primaryKeys The primary keys of the item to delete.
   * @param deleteItemOpts Options for the underlying `DeleteItem` operation.
   * @returns The deleted item.
   */
  readonly deleteItem = async (
    primaryKeys: KeyParameters<Schema>,
    deleteItemOpts: DeleteItemOpts = {}
  ): Promise<ItemType> => {
    const unaliasedKeys: ItemKeys = this.processKeyArgs(primaryKeys);

    const response = await this.ddb.deleteItem({
      ...deleteItemOpts,
      Key: unaliasedKeys,
      ReturnValues: "ALL_OLD", // <-- ensures the response contains `Attributes`
    });

    return this.processItemAttributes.fromDB<ItemType>(response.Attributes!);
  };

  /**
   * A [`BatchWriteItem`][api-ref] operation wrapper optimized for deleting items.
   *
   * > Note: `BatchWriteItem` does not support condition expressions.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   *
   * @param primaryKeys The primary keys of the items to delete.
   * @param batchDeleteItemsOpts Options for the underlying `BatchWriteItem` operation.
   */
  readonly batchDeleteItems = async (
    primaryKeys: Array<KeyParameters<Schema>>,
    batchDeleteItemsOpts: BatchWriteItemsOpts = {}
  ): Promise<Array<KeyParameters<Schema>>> => {
    const { deleteItems = [] } = await this.batchUpsertAndDeleteItems(
      { deleteItems: primaryKeys },
      batchDeleteItemsOpts
    );

    return deleteItems;
  };

  /**
   * A [`BatchWriteItem`][api-ref] operation wrapper which can be used for both
   * upserting and deleting items. Note that while each individual underlying Put/Delete operation
   * _is_ atomic, they're not atomic as a a whole, despite occurring within the same call (this is
   * an AWS implementation limitation).
   *
   * > Note: `BatchWriteItem` does not support condition expressions.
   *
   * - **Max Chunk Size**: The provided put-requests are broken into chunks of 25 (the max limit for
   *   BatchWriteItem requests), and each chunk is submitted as a separate BatchWriteItem request.
   *
   * - **Automatic Retries**: Per AWS recommendations, batch requests which result in an error code
   *   that indicates the provisioned throughput has been exceeded, or that the on-demand request
   *   limit has been exceeded, are automatically retried. All other errors are re-thrown.
   *
   * - **Unprocessed Items**: Any `UnprocessedItems` returned by the batch request are re-submitted.
   *
   * - **Exponential Backoff**: All retries are implemented with an exponential backoff strategy:
   *   1. First request: no delay
   *   2. Second request: delay `initialDelay` milliseconds (default: 100)
   *   3. All subsequent request delays are equal to the previous delay multiplied by the
   *      `timeMultiplier` (default: 2), until either:
   *      - The `maxRetries` limit is reached (default: 10), or
   *      - The `maxDelay` limit is reached (default: 3500, or 3.5 seconds)
   *
   *      Ergo, the base `delay` calculation can be summarized as follows:
   *        > `initialDelay * timeMultiplier^attemptNumber milliseconds`
   *
   *      If `useJitter` is true (default: false), the `delay` is randomized by applying the following
   *      to the base `delay`: `Math.round(Math.random() * delay)`. Note that the determination as to
   *      whether the delay exceeds the `maxDelay` is made BEFORE the jitter is applied.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   *
   * @param upsertItems An array of items to upsert.
   * @param deleteItems An array of primary keys of items to delete.
   * @param batchUpsertItemsOpts Options for the underlying `BatchWriteItem` operation.
   * @throws {ItemInputError} If neither `upsertItems` nor `deleteItems` are arrays.
   */
  readonly batchUpsertAndDeleteItems = async (
    {
      upsertItems,
      deleteItems,
    }: {
      upsertItems?: Array<ItemCreationParams>;
      deleteItems?: Array<KeyParameters<Schema>>;
    },
    batchWriteItemsOpts: BatchWriteItemsOpts = {}
  ): Promise<{
    upsertItems?: Array<ItemType>;
    deleteItems?: Array<KeyParameters<Schema>>;
  }> => {
    // Safety-check: throw error if neither `upsertItems` nor `deleteItems` are arrays
    if (!isArray(upsertItems) && !isArray(deleteItems))
      throw new ItemInputError("batchUpsertAndDeleteItems was called without valid arguments.");

    // Process any `upsertItems`, and add timestamps if `autoAddTimestamps` is enabled
    const toDBupsertItems: Array<{ [attrName: string]: NativeAttributeValue }> = isArray(
      upsertItems
    )
      ? upsertItems.map((item) =>
          this.processItemAttributes.toDB({
            ...(this.schemaOptions.autoAddTimestamps && {
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            ...item,
          })
        )
      : [];

    // Process any `deleteItems`
    const toDBunaliasedKeysToDelete: Array<ItemKeys> = isArray(deleteItems)
      ? deleteItems.map((pks) => this.processKeyArgs(pks))
      : [];

    // Make the array of BatchWriteItem request objects:
    const batchWriteItemRequestObjects = [
      ...toDBupsertItems.map((itemObj) => ({
        PutRequest: { Item: itemObj }, // <-- upsert items formatted as PutRequest objects
      })),
      ...toDBunaliasedKeysToDelete.map((keysObj) => ({
        DeleteRequest: { Key: keysObj }, // <-- deletion keys formatted as DeleteRequest objects
      })),
    ];

    await this.ddb.batchWriteItems({
      ...batchWriteItemsOpts,
      RequestItems: {
        [this.tableName]: batchWriteItemRequestObjects,
      },
    });

    // BatchWrite does not return items, so the input params are formatted for return.
    return {
      upsertItems: toDBupsertItems.map((item) => this.processItemAttributes.fromDB<ItemType>(item)),
      ...(deleteItems && { deleteItems }),
    };
  };

  /**
   * [`Query`][api-ref] operation wrapper which applies defaults and/or transforms defined in
   * this Model's schema to the returned items.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
   *
   * // IDEA - Restrict QueryOpts.IndexName to only be a valid index name for the table.
   *
   * @param queryOpts Options for the underlying `Query` operation.
   * @returns The items, if found.
   */
  readonly query = async ({
    where,
    limit, // lower-cased alias for "Limit"
    KeyConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    IndexName,
    ...queryOpts
  }: QueryOpts<ItemType>): Promise<Array<ItemType>> => {
    // If a WhereQuery object is provided, use it to generate the KeyConditionExpression
    if (where) {
      // Unalias the keys
      const unaliasedWhere = ioActions.aliasMapping(where, {
        ioDirection: "toDB",
        aliasesMap: this.aliasesToAttributesMap,
        modelName: this.modelName,
        schema: this.schema,
        schemaEntries: this.schemaEntries,
        schemaOptions: this.schemaOptions,
      }) as typeof where;

      // Generate the KeyConditionExpression and related values
      ({ KeyConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
        convertWhereQueryToSdkQueryArgs({ where: unaliasedWhere }));

      // Check if IndexName needs to be added, test if `unaliasedWhere` contains the table's PK+SK
      const [pkAttrName, skAttrName] = Object.keys(unaliasedWhere);

      if (
        !IndexName // skAttrName may be undefined if the `where` only contains the PK
        && (pkAttrName !== this.tableHashKey || (!!skAttrName && skAttrName !== this.tableRangeKey))
      ) {
        // Get IndexName by searching table's indexes for matching PK+SK
        for (const indexName in this.indexes) {
          if (
            pkAttrName === this.indexes[indexName].indexPK
            && (!skAttrName || skAttrName === this.indexes[indexName].indexSK)
          ) {
            IndexName = indexName;
            break;
          }
        }
      }
    }

    // Run the query
    const response = await this.ddb.query({
      ...queryOpts,
      ...(KeyConditionExpression && { KeyConditionExpression }),
      ...(ExpressionAttributeNames && { ExpressionAttributeNames }),
      ...(ExpressionAttributeValues && { ExpressionAttributeValues }),
      ...(IndexName && { IndexName }),
      ...(!!limit && { Limit: limit }),
    });

    // If `items` is undefined, return an empty array instead of undefined
    return response.Items?.map((item) => this.processItemAttributes.fromDB(item)) ?? [];
  };

  /**
   * [`Scan`][api-ref] operation wrapper which applies defaults and/or transforms defined in
   * this Model's schema to the returned items.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   *
   * // IDEA - Restrict ScanOpts.IndexName to only be a valid index name for the table.
   *
   * @param scanOpts Options for the underlying `Scan` operation.
   * @returns The items, if found.
   */
  readonly scan = async (scanOpts: ScanOpts = {}): Promise<Array<ItemType>> => {
    const response = await this.ddb.scan(scanOpts);

    return response.Items?.map((item) => this.processItemAttributes.fromDB(item)) ?? [];
  };

  // INSTANCE METHOD UTILS:

  /**
   * Value-transforming action sets grouped by data flow directionality.
   *
   * | `Method` | Description                                                         |
   * | :------- | :-----------------------------------------------------------------: |
   * | `toDB`   | Actions executed on values _before_ being passed to the SDK client. |
   * | `fromDB` | Actions executed on values _returned_ from the SDK client.          |
   */
  readonly processItemAttributes = {
    /**
     * This method applies `toDB` IO-Actions to the provided `itemAttrs`.
     * @param itemAttrs The values to be modified for the SDK client.
     * @param enabledIOActions Boolean flags for enabling/disabling `toDB` IO-Actions.
     * @returns The item after being processed by the `toDB` IO-Actions.
     */
    toDB: <
      ProcessedItemAttributes extends { [attrName: string]: NativeAttributeValue } = {
        [attrName: string]: NativeAttributeValue;
      },
    >(
      itemAttrs: BaseItem,
      {
        // When a 2nd argument is provided, only the specified toDB IO-Actions are enabled:
        aliasMapping = false,
        setDefaults = false,
        transformValues = false,
        transformItem = false,
        typeChecking = false,
        validate = false,
        validateItem = false,
        convertJsTypes = false,
        checkRequired = false,
      }: EnabledIOActions<"toDB"> = {
        // When no 2nd argument is provided, all toDB IO-Actions are enabled by default:
        aliasMapping: true,
        setDefaults: true,
        transformValues: true,
        transformItem: true,
        typeChecking: true,
        validate: true,
        validateItem: true,
        convertJsTypes: true,
        checkRequired: true,
      }
    ): ProcessedItemAttributes => {
      // Assemble array of enabled IO-Actions in toDB order:
      const toDBioActionsSet = [];
      if (aliasMapping) toDBioActionsSet.push(ioActions.aliasMapping);
      if (setDefaults) toDBioActionsSet.push(ioActions.setDefaults);
      if (transformValues) toDBioActionsSet.push(ioActions.transformValues);
      if (transformItem) toDBioActionsSet.push(ioActions.transformItem);
      if (typeChecking) toDBioActionsSet.push(ioActions.typeChecking);
      if (validate) toDBioActionsSet.push(ioActions.validate);
      if (validateItem) toDBioActionsSet.push(ioActions.validateItem);
      if (convertJsTypes) toDBioActionsSet.push(ioActions.convertJsTypes);
      if (checkRequired) toDBioActionsSet.push(ioActions.checkRequired);

      return this.applyIOActionsToItemAttributes(itemAttrs, toDBioActionsSet, {
        ioDirection: "toDB",
        aliasesMap: this.aliasesToAttributesMap,
      });
    },
    /**
     * This method applies `fromDB` IO-Actions to the provided `itemAttrs`.
     * @param itemAttrs The values returned from the SDK client.
     * @param enabledIOActions Boolean flags for enabling/disabling `fromDB` IO-Actions.
     * @returns The values processed by the `fromDB` IO-Actions.
     */
    fromDB: <ProcessedItemAttributes extends BaseItem = BaseItem>(
      itemAttrs: BaseItem,
      {
        // When a 2nd argument is provided, only the specified fromDB IO-Actions are enabled:
        convertJsTypes = false,
        transformValues = false,
        transformItem = false,
        aliasMapping = false,
      }: EnabledIOActions<"fromDB"> = {
        // When no 2nd argument is provided, all fromDB IO-Actions are enabled by default:
        convertJsTypes: true,
        transformValues: true,
        transformItem: true,
        aliasMapping: true,
      }
    ): ProcessedItemAttributes => {
      // Assemble array of enabled IO-Actions in fromDB order:
      const fromDBioActionsSet = [];
      if (convertJsTypes) fromDBioActionsSet.push(ioActions.convertJsTypes);
      if (transformValues) fromDBioActionsSet.push(ioActions.transformValues);
      if (transformItem) fromDBioActionsSet.push(ioActions.transformItem);
      if (aliasMapping) fromDBioActionsSet.push(ioActions.aliasMapping);

      return this.applyIOActionsToItemAttributes(itemAttrs, fromDBioActionsSet, {
        ioDirection: "fromDB",
        aliasesMap: this.attributesToAliasesMap,
      });
    },
  };

  /**
   * This method applies an array of IO-Actions to the provided `itemAttrs` object. It sets default
   * IO-Actions context values which can be overridden via the {@link IOActionContext} parameter.
   *
   * @param itemAttrs The item attributes to apply IO-Actions to.
   * @param ioActionsSet The array of IO-Actions to apply.
   * @param ioActionsCtxOverrides Optional overrides for the IO-Actions context object.
   * @returns The item after being processed by the IO-Actions.
   */
  private readonly applyIOActionsToItemAttributes = <
    ItemAttributes extends BaseItem,
    ProcessedItemAttributes extends BaseItem = ItemAttributes,
  >(
    itemAttrs: ItemAttributes,
    ioActionsSet: Array<IOAction>,
    {
      ioDirection,
      aliasesMap,
      modelName = this.modelName,
      schema: schemaOverride,
      schemaEntries,
      schemaOptions = this.schemaOptions,
      ...ioActionsCtxOverrides
    }: SetOptional<IOActionContext, Exclude<keyof IOActionContext, "ioDirection" | "aliasesMap">>
  ): ProcessedItemAttributes => {
    // Top-level IO-Actions ctx object:
    const ioActionsCtx = {
      ioDirection,
      aliasesMap,
      modelName,
      ...(schemaOverride
        ? // If a schemaOverride is provided, use it to set a default for schemaEntries
          {
            schema: schemaOverride,
            schemaEntries: schemaEntries ?? Object.entries(schemaOverride),
          }
        : // Else use the Model's base schema+schemaEntries
          {
            schema: this.schema,
            schemaEntries: this.schemaEntries,
          }),
      schemaOptions,
      ...ioActionsCtxOverrides,
    };

    // Reduce array of IO-Actions using itemAttrs as the init accum
    const processedItemAttrs = ioActionsSet.reduce(
      (itemAccum: BaseItem, ioAction) => ioAction.call(ioActions, itemAccum, ioActionsCtx),
      itemAttrs
    );

    return processedItemAttrs as ProcessedItemAttributes;
  };

  /**
   * This private Model method takes primary key args from public methods like `Model.getItem` and
   * applies key-specific IO-Actions accordingly. The IO-Actions context object provided to the
   * `applyIOActionsToItemAttributes` private method only contains the key attributes, i.e., the
   * provided `schema` only contains the `tableHashKey` and `tableRangeKey` attributes.
   */
  private readonly processKeyArgs = (primaryKeyArgs: KeyParameters<Schema>): ItemKeys => {
    // Apply IO-Actions to the primary key args
    return this.applyIOActionsToItemAttributes(
      primaryKeyArgs,
      [
        ioActions.aliasMapping,
        ioActions.setDefaults,
        ioActions.transformValues,
        ioActions.typeChecking,
        ioActions.validate,
        ioActions.convertJsTypes,
        ioActions.checkRequired,
      ],
      {
        ioDirection: "toDB",
        aliasesMap: this.aliasesToAttributesMap,
        schema: this.schemaWithKeysOnly,
        schemaEntries: [
          [this.tableHashKey, this.schema[this.tableHashKey]],
          ...(this.tableRangeKey
            ? [
                [this.tableRangeKey, this.schema[this.tableRangeKey]] satisfies [
                  string,
                  ModelSchemaAttributeConfig,
                ],
              ]
            : []),
        ],
      }
    );
  };
}
