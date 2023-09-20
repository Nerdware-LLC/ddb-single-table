import { ioActions } from "./ioActions";
import { validateModelSchema } from "./validateModelSchema";
import { handleBatchRequests, type BatchRequestFunction } from "../BatchRequests";
import { DdbClientWrapper } from "../DdbClientWrapper";
import { generateUpdateExpression, convertWhereQueryToSdkQueryArgs } from "../Expressions";
import { hasKey, isRecordObject, ItemInputError } from "../utils";
import type { WhereQueryParam } from "../Expressions";
import type { TableIndexes } from "../Table";
import type {
  // Model schema types:
  ModelSchemaType,
  ModelSchemaOptions,
  SchemaEntries,
  // Item types:
  BaseItem,
  ItemKeys,
  ItemTypeFromSchema,
  ItemCreationParameters,
  ItemParameters,
  DynamoDbItemType,
  OneOrMoreMaybePartialItems,
  AscertainItemProcessingReturnType,
} from "../types";
import type { IODirection, IOActionContext } from "./ioActions";
import type {
  AttributesAliasesMap,
  AliasedPrimaryKeys,
  GetItemOpts,
  BatchGetItemsOpts,
  CreateItemOpts,
  UpsertItemOpts,
  UpdateItemOpts,
  DeleteItemOpts,
  BatchWriteItemsOpts,
  QueryOpts,
  ScanOpts,
  IOActionSetFn,
  IOBehavioralOpts,
} from "./types";

/**
 * Each Model instance is provided with a set of CRUD methods featuring parameter
 * and return types which reflect the Model's schema. Model instance methods wrap
 * a corresponding method of the DdbClientWrapper instance with sets of
 * "{@link IOActionSetFn|IO Actions}" which use the Model's schema to provide
 * functionality related to database-IO like alias mapping, value validation, etc.
 *
 * There are two sets of IO-Actions, grouped by data flow directionality:
 * 1. **`toDB`**: IO-Actions executed on objects being _sent to_ the database.
 *    - Only used for _write_ operations.
 * 2. **`fromDB`**: IO-Actions executed on objects being _returned from_ the database.
 *    - Used for both _read_ AND _write_ operations which return 1+ items.
 *
 * The IO-Actions undertaken for each set are listed below in order of execution. Note
 * that some IO-Actions are skipped by certain methods, depending on the method's purpose.
 * For example, objects provided to `Model.updateItem` are not subjected to `"required"`
 * checks, since the method is intended to update individual properties of existing items.
 * _See **{@link ioActions}** for more info an any of the IO-Actions listed below._
 *
 * **`toDB`**:
 * 1. **`Alias Mapping`** — Replaces "alias" keys with attribute names.
 * 2. **`Set Defaults`** — Applies defaults defined in the schema.
 * 3. **`Attribute toDB Modifiers`** — Runs your `transformValue.toDB` fns.
 * 4. **`Item toDB Modifier`** — Runs your `transformItem.toDB` fn.
 * 5. **`Type Checking`** — Checks properties for conformance with their `"type"`.
 * 6. **`Attribute Validation`** — Validates individual item properties.
 * 7. **`Item Validation`** — Validates an item in its entirety.
 * 8. **`Convert JS Types`** — Converts JS types into DynamoDB types.
 * 9. **`"Required" Checks`** — Checks for the existence of `"required"` attributes.
 *
 * **`fromDB`**:
 * 1. **`Convert JS Types`** — Converts DynamoDB types into JS types.
 * 2. **`Attribute fromDB Modifiers`** — Runs your `transformValue.fromDB` fns.
 * 3. **`Item fromDB Modifier`** — Runs your `transformItem.fromDB` fn.
 * 4. **`Alias Mapping`** — Replaces attribute names with "alias" keys.
 *
 * #### Ordering of Attributes
 * Both `toDB` and `fromDB` IO-Actions which process individual attributes always
 * process attributes in the same order:
 *   1. The table hash key is always processed first.
 *   2. The table sort key is always processed second.
 *   3. Any index PKs are processed after the table SK.
 *   4. All other attributes are then processed in the order they are defined in the schema.
 *
 * Aside from ensuring predictable execution, this consistency also opens up design
 * opportunities for your various schema. For example, if you have a schema which uses a
 * function to dynamically generate a default value for an `id` attribute which is used as
 * the table hash key, other non-key attributes may be defined using the item's generated
 * `id` value.
 *
 * @class
 * @template Schema - The Model's schema type.
 * @template ItemType - The type of items returned by the Model's methods.
 * @template ItemInput - The type of items accepted by the Model's methods.
 * @template KeyParams - The type of PK args for methods like `getItem`.
 * @param {string} modelName - The name of the Model.
 * @param {Schema} modelSchema - The Model's schema.
 * @param {ModelSchemaOptions} [modelSchemaOptions] - Options for the Model's schema.
 */
export class Model<
  Schema extends ModelSchemaType,
  ItemType extends BaseItem = ItemTypeFromSchema<Schema>,
  ItemCreationParams extends BaseItem = ItemCreationParameters<Schema>,
  ItemParams extends Partial<ItemCreationParams> = ItemParameters<ItemCreationParams>,
  DdbItemType extends BaseItem = DynamoDbItemType<ItemParams>,
  KeyParams extends ItemKeys = AliasedPrimaryKeys<Schema>,
> {
  // STATIC PROPERTIES

  private static readonly DEFAULT_MODEL_SCHEMA_OPTS: ModelSchemaOptions = {
    allowUnknownAttributes: false,
    autoAddCreatedAt: { enabled: true, attrName: "createdAt" },
  };

  // INSTANCE PROPERTIES

  readonly modelName: string;
  readonly schema: Schema;
  readonly schemaEntries: SchemaEntries;
  readonly schemaOptions: ModelSchemaOptions;
  readonly attributesToAliasesMap: AttributesAliasesMap;
  readonly aliasesToAttributesMap: AttributesAliasesMap;
  readonly tableName: string;
  readonly tableHashKey: string;
  readonly tableRangeKey: string;
  readonly indexes: TableIndexes;
  readonly ddbClient: DdbClientWrapper;

  constructor(
    modelName: string,
    modelSchema: Schema,
    /** {@link ModelSchemaOptions} and table+index properties from a `Table` instance. */
    {
      tableName,
      tableHashKey,
      tableRangeKey,
      indexes,
      ddbClient,
      allowUnknownAttributes,
      transformItem,
      validateItem,
      autoAddCreatedAt = {},
    }: ModelSchemaOptions & {
      tableName: string;
      tableHashKey: string;
      tableRangeKey: string;
      indexes: TableIndexes;
      ddbClient: DdbClientWrapper;
    }
  ) {
    // Validate the Model schema and obtain the Model's alias maps
    const { attributesToAliasesMap, aliasesToAttributesMap } = validateModelSchema({
      modelName,
      modelSchema,
    });

    this.modelName = modelName;
    this.schema = modelSchema;
    this.schemaOptions = {
      transformItem,
      validateItem,
      allowUnknownAttributes:
        allowUnknownAttributes ?? Model.DEFAULT_MODEL_SCHEMA_OPTS.allowUnknownAttributes,
      autoAddCreatedAt: {
        ...Model.DEFAULT_MODEL_SCHEMA_OPTS.autoAddCreatedAt,
        ...autoAddCreatedAt,
      },
    };

    this.attributesToAliasesMap = attributesToAliasesMap;
    this.aliasesToAttributesMap = aliasesToAttributesMap;
    this.tableName = tableName;
    this.tableHashKey = tableHashKey;
    this.tableRangeKey = tableRangeKey;
    this.indexes = indexes;
    this.ddbClient = ddbClient;

    // Cache sorted schema entries for IOActions
    this.schemaEntries = Object.entries(modelSchema).sort(([attrNameA], [attrNameB]) => {
      return attrNameA === tableHashKey // Sort tableHashKey to the front
        ? -1
        : attrNameB === tableHashKey
        ? 1
        : attrNameA === tableRangeKey // tableRangeKey goes after tableHashKey
        ? -1
        : attrNameB === tableRangeKey
        ? 1
        : attrNameA in indexes // index PKs, if any, go after tableRangeKey
        ? -1
        : attrNameB in indexes
        ? 1
        : 0; // For all other attributes the order is unchanged
    });
  }

  /**
   * [`GetItem`][ddb-docs-get-item] operation wrapper.
   *
   * [ddb-docs-get-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
   *
   * @param primaryKeys The primary keys of the item to get.
   * @param getItemOpts Options for the underlying `GetItem` operation.
   * @returns The item, if found.
   */
  readonly getItem = async (
    primaryKeys: KeyParams,
    getItemOpts: GetItemOpts = {}
  ): Promise<ItemType | undefined> => {
    const unaliasedKeys = this.processKeyArgs(primaryKeys);

    const response = await this.ddbClient.getItem({
      ...(getItemOpts ?? {}),
      TableName: this.tableName,
      Key: unaliasedKeys,
    });

    const item = response?.Item;

    if (item) {
      return this.processItemData.fromDB(item);
    }
  };

  /**
   * [`BatchGetItem`][ddb-docs-batch-get] operation wrapper.
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
   * [ddb-docs-batch-get]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   *
   * @param primaryKeys The primary keys of the items to get.
   * @param batchGetItemsOpts Options for the underlying `BatchGetItem` operation.
   * @returns The items, if found.
   * @throws {ItemInputError} If `primaryKeys` is not an array.
   */
  readonly batchGetItems = async (
    primaryKeys: Array<KeyParams>,
    { exponentialBackoffConfigs, ...batchGetItemOpts }: BatchGetItemsOpts = {}
  ): Promise<Array<ItemType>> => {
    // Safety-check: throw error if `primaryKeys` is not an array
    if (!Array.isArray(primaryKeys)) {
      throw new ItemInputError(`[batchGetItems] The "primaryKeys" parameter must be an array.`);
    }

    const unaliasedKeys: Array<ItemKeys> = primaryKeys.map((pks) => this.processKeyArgs(pks));

    // Init array for successfully returned items:
    const returnedItems: Array<BaseItem> = [];

    // Define the fn for the batch-requests handler, ensure it updates `returnedItems`
    const submitBatchGetItemRequest: BatchRequestFunction = async (batchGetItemReqObjects) => {
      const response = await this.ddbClient.batchGetItems({
        ...batchGetItemOpts,
        RequestItems: {
          [this.tableName]: {
            Keys: batchGetItemReqObjects,
          },
        },
      });
      // Get any successfully returned items from the response
      const items = response?.Responses?.[this.tableName];
      // If the response returned items, add them to the `batchGetItems` array
      if (Array.isArray(items)) returnedItems.push(...items);
      // Return any unprocessed keys
      return response?.UnprocessedKeys?.[this.tableName]?.Keys;
    };

    // Submit the function to the batch-requests handler
    await handleBatchRequests(
      submitBatchGetItemRequest,
      unaliasedKeys,
      100, // <-- chunk size
      exponentialBackoffConfigs
    );

    return this.processItemData.fromDB(returnedItems);
  };

  /**
   * A [`PutItem`][ddb-docs-put-item] operation wrapper which guarantees existing items will not be
   * overwritten by always including a [`ConditionExpression` which checks for the non-existence of
   * the item's hash key][ddb-docs-conditional-put].
   *
   * If the Model's `schemaOptions` are configured to auto-add timestamps, this method will also add
   * a `createdAt` attribute (or the `attrName` specified for the custom timestamp attribute) set to
   * the current timestamp.
   *
   * [ddb-docs-put-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   * [ddb-docs-conditional-put]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html#Expressions.ConditionExpressions.PreventingOverwrites
   *
   * @param item The item to create.
   * @param createItemOpts Options for the underlying `PutItem` operation.
   * @returns The provided `item` with any schema-defined defaults and transformations applied.
   */
  readonly createItem = async (
    item: ItemCreationParams,
    createItemOpts: CreateItemOpts = {}
  ): Promise<ItemType> => {
    // Get "createdAt" auto-add options from schemaOptions
    const { enabled = true, attrName = "createdAt" } = this.schemaOptions.autoAddCreatedAt || {};

    // Add "createdAt" timestamp if not disabled
    const toDBitem: DdbItemType = this.processItemData.toDB({
      ...(enabled && { [attrName]: new Date() }),
      ...item,
    });

    /* The `ReturnValues` param for PutItem can only be "NONE" or "ALL_OLD", so DDB
    will never return anything here where PutItem is used to create a new item.  */
    await this.ddbClient.putItem({
      ...createItemOpts,
      TableName: this.tableName,
      Item: toDBitem,
      ConditionExpression: `attribute_not_exists(${this.tableHashKey})`,
      /* Note that appending "AND attribute_not_exists(sk)" to the
      above expression would be extraneous, since DDB PutItem first
      looks for an Item with the specified item's keys, and THEN it
      applies the condition expression if it finds one.          */
    });

    /* Since the above DDB operation will never return anything, `processItemData.fromDB`
    is called with the `toDBitem`, which will have schema-defined defaults and whatnot.*/
    return this.processItemData.fromDB(toDBitem);
  };

  /**
   * A [`PutItem`][ddb-docs-put-item] operation wrapper which will either update an existing item or
   * create a new one if an item with the specified keys does not yet exist.
   *
   * [ddb-docs-put-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   *
   * @param item The item to upsert.
   * @param upsertItemOpts Options for the underlying `PutItem` operation.
   * @returns The provided `item` with any schema-defined defaults and transformations applied.
   */
  readonly upsertItem = async (
    item: ItemCreationParams,
    upsertItemOpts: UpsertItemOpts = {}
  ): Promise<ItemType> => {
    const toDBitem: DdbItemType = this.processItemData.toDB(item);

    await this.ddbClient.putItem({
      ReturnValues: "ALL_OLD", // overridable default
      ...upsertItemOpts,
      TableName: this.tableName,
      Item: toDBitem,
    });

    return this.processItemData.fromDB(toDBitem);
  };

  /**
   * A [`BatchWriteItem`][ddb-docs-batch-write] operation wrapper optimized for upserting items.
   *
   * > Note: `BatchWriteItem` does not support condition expressions.
   *
   * [ddb-docs-batch-write]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
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
   * [`UpdateItem`][ddb-docs-update-item] operation wrapper. If an `UpdateExpression` is not
   * provided, this method can auto-generate one for you using the `updateAttributes` param's keys
   * and values to form SET and REMOVE clauses as needed.
   *
   * The function which generates the `UpdateExpression` also creates `ExpressionAttributeValues`
   * and `ExpressionAttributeNames`. Consequently, if you provide an explicit EAV argument (e.g.,
   * for a `ConditionExpression`) _without_ also providing an `UpdateExpression`, the function
   * will currently throw an error. This is a known issue and will be addressed in a future release.
   *
   * [ddb-docs-update-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   *
   * @param primaryKeys The primary keys of the item to update.
   * @param updateAttributes The attributes to update.
   * @param updateItemOpts Options for the underlying `UpdateItem` operation.
   * @throws {ItemInputError} if `UpdateExpression` is not provided and one cannot be auto-generated.
   * @returns The updated item.
   */
  readonly updateItem = async (
    primaryKeys: KeyParams,
    {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues = "ALL_NEW",
      // Auto-gen opts:
      update,
      updateOptions,
      ...updateItemOpts
    }: UpdateItemOpts<ItemParams>
  ): Promise<Partial<ItemType>> => {
    /* Init var to hold `toDBupdateAttributes` (see below) for the edge case whereby the caller
    uses an auto-gen'd `UpdateExpression` and also provides an explicit `ReturnValues` of "NONE".
    In this case, the `toDBupdateAttributes` is provided to the `processItemData.fromDB` call
    to ensure this function will at least return schema-defined defaults and transforms, even if
    the caller configures the actual DDB API call to return nothing. */
    let toDBupdateAttributes: ItemParams | undefined;

    // If an explicit `UpdateExpression` is not provided, check `update`
    if (!UpdateExpression) {
      // If neither are provided, throw an error
      if (!isRecordObject(update)) {
        throw new ItemInputError(
          `[updateItem] For auto-generated "UpdateExpression"s, the "update" parameter must ` +
            `be provided. Alternatively, an explicit "UpdateExpression" may be provided.`
        );
      }
      /* Ensure neither `ExpressionAttributeNames` nor `ExpressionAttributeValues` are provided.
      Currently, auto-gen will overwrite EA-Names/Values, so an error is thrown to ensure the caller
      hasn't provided them. This all-or-nothing approach is not ideal, but it's the simplest way to
      handle this for now.

      IDEA Consider how auto-gen'd values in this case could be merged with provided values.

      - One way would be to filter the `attributesToUpdate` arg to remove any keys which are already
        present in the provided `ExpressionAttributeNames` object. This would allow the caller to
        provide EA-Names/Values for some attributes, and let the rest be auto-gen'd.
      - This logic could also be simply moved out of this method and placed elsewhere. */

      if (ExpressionAttributeNames || ExpressionAttributeValues) {
        throw new ItemInputError(
          `[updateItem] When using auto-generated "UpdateExpression"s, the following parameters ` +
            `must not be provided: "ExpressionAttributeNames", "ExpressionAttributeValues".`
        );
      }

      // Run `updateAttributes` through `processItemData.toDB`
      const toDBupdateAttributes: ItemParams = this.processItemData.toDB(update, {
        shouldSetDefaults: false,
        shouldTransformItem: false,
        shouldValidateItem: false,
        shouldCheckRequired: false,
      });

      // Generate the `UpdateExpression` and `ExpressionAttribute{Names,Values}`
      ({ UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
        generateUpdateExpression(toDBupdateAttributes, updateOptions));
    }

    const unaliasedKeys: Array<ItemKeys> = this.processKeyArgs(primaryKeys);

    const response = await this.ddbClient.updateItem({
      ...updateItemOpts,
      TableName: this.tableName,
      Key: unaliasedKeys,
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues,
    });

    return this.processItemData.fromDB(response?.Attributes ?? toDBupdateAttributes);
  };

  /**
   * [`DeleteItem`][ddb-docs-del-item] operation wrapper.
   *
   * [ddb-docs-del-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   *
   * @param primaryKeys The primary keys of the item to delete.
   * @param deleteItemOpts Options for the underlying `DeleteItem` operation.
   * @returns The deleted item if `ReturnValues` is set to `"ALL_OLD"` (default), else `undefined`.
   */
  readonly deleteItem = async (primaryKeys: KeyParams, deleteItemOpts: DeleteItemOpts = {}) => {
    const unaliasedKeys = this.processKeyArgs(primaryKeys);

    const response = await this.ddbClient.deleteItem({
      ReturnValues: "ALL_OLD", // overridable default
      ...deleteItemOpts,
      TableName: this.tableName,
      Key: unaliasedKeys,
    });

    const itemAttributes = response?.Attributes;

    if (itemAttributes) {
      return this.processItemData.fromDB(itemAttributes);
    }
  };

  /**
   * A [`BatchWriteItem`][ddb-docs-batch-write] operation wrapper optimized for deleting items.
   *
   * > Note: `BatchWriteItem` does not support condition expressions.
   *
   * [ddb-docs-batch-write]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   *
   * @param primaryKeys The primary keys of the items to delete.
   * @param batchDeleteItemsOpts Options for the underlying `BatchWriteItem` operation.
   */
  readonly batchDeleteItems = async (
    primaryKeys: Array<KeyParams>,
    batchDeleteItemsOpts: BatchWriteItemsOpts = {}
  ): Promise<KeyParams> => {
    const { deleteItems = [] } = await this.batchUpsertAndDeleteItems(
      { deleteItems: primaryKeys },
      batchDeleteItemsOpts
    );

    return deleteItems;
  };

  /**
   * A [`BatchWriteItem`][ddb-docs-batch-write] operation wrapper which can be used for both
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
   * [ddb-docs-batch-write]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
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
      deleteItems?: Array<KeyParams>;
    },
    { exponentialBackoffConfigs, ...batchUpsertAndDeleteItemsOpts }: BatchWriteItemsOpts = {}
  ): Promise<{
    upsertItems?: Array<ItemType>;
    deleteItems?: Array<KeyParams>;
  }> => {
    // Safety-check: throw error if neither `upsertItems` nor `deleteItems` are arrays
    if (!Array.isArray(upsertItems) && !Array.isArray(deleteItems)) {
      throw new ItemInputError("batchUpsertAndDeleteItems was called without valid arguments.");
    }

    const toDBupsertItems: Array<DdbItemType> = Array.isArray(upsertItems)
      ? this.processItemData.toDB(upsertItems)
      : [];

    const toDBunaliasedKeysToDelete: Array<ItemKeys> = Array.isArray(deleteItems)
      ? deleteItems.map((pks) => this.processKeyArgs(pks))
      : [];

    // Make the array of BatchWriteItem request objects:
    const batchWriteItemRequestObjects = [
      ...toDBupsertItems.map((itemObj: ItemCreationParams) => ({
        PutRequest: { Item: itemObj }, // <-- upsert items formatted as PutRequest objects
      })),
      ...toDBunaliasedKeysToDelete.map((keysObj) => ({
        DeleteRequest: { Key: keysObj }, // <-- deletion keys formatted as DeleteRequest objects
      })),
    ];

    // Define the fn for the batch-requests handler
    const submitBatchWriteItemRequest: BatchRequestFunction = async (batchWriteItemReqObjects) => {
      const response = await this.ddbClient.batchWriteItems({
        ...batchUpsertAndDeleteItemsOpts,
        RequestItems: {
          [this.tableName]: batchWriteItemReqObjects,
        },
      });
      // Return any unprocessed items
      return response?.UnprocessedItems?.[this.tableName];
    };

    // Submit the function to the batch-requests handler
    await handleBatchRequests(
      submitBatchWriteItemRequest,
      batchWriteItemRequestObjects,
      25, // <-- chunk size
      exponentialBackoffConfigs
    );

    // BatchWrite does not return items, so the input params are formatted for return.
    return {
      upsertItems: this.processItemData.fromDB(toDBupsertItems),
      deleteItems,
    };
  };

  /**
   * [`Query`][ddb-docs-query] operation wrapper which applies defaults and/or transforms defined in
   * this Model's schema to the returned items.
   *
   * [ddb-docs-query]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
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
      where = ioActions.aliasMapping(where, {
        ioDirection: "toDB",
        modelName: this.modelName,
        schema: this.schema,
        schemaEntries: this.schemaEntries,
        schemaOptions: this.schemaOptions,
        attributesToAliasesMap: this.attributesToAliasesMap,
        aliasesToAttributesMap: this.aliasesToAttributesMap,
      });

      // Generate the KeyConditionExpression and related values
      ({ KeyConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
        convertWhereQueryToSdkQueryArgs({ where }));

      // Check if IndexName needs to be provided by testing if `where` contains the table's PK+SK
      const [pkAttrName, skAttrName] = Object.keys(where);

      if (
        !IndexName && // skAttrName may be undefined if the `where` only contains the PK
        (pkAttrName !== this.tableHashKey || (!!skAttrName && skAttrName !== this.tableRangeKey))
      ) {
        // Get IndexName by searching table's indexes for matching PK+SK
        for (const indexName in this.indexes) {
          if (
            pkAttrName === this.indexes[indexName].indexPK &&
            (!skAttrName || skAttrName === this.indexes[indexName]?.indexSK)
          ) {
            IndexName = indexName;
            break;
          }
        }
      }
    }

    // Run the query
    const response = await this.ddbClient.query({
      ...queryOpts,
      TableName: this.tableName,
      KeyConditionExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      IndexName,
      ...(!!limit && { Limit: limit }),
    });

    const items = response?.Items;

    // If `items` is undefined, return an empty array instead of undefined
    return this.processItemData.fromDB(items ?? []);
  };

  /**
   * [`Scan`][ddb-docs-scan] operation wrapper which applies defaults and/or transforms defined in
   * this Model's schema to the returned items.
   *
   * [ddb-docs-scan]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   *
   * // IDEA - Restrict ScanOpts.IndexName to only be a valid index name for the table.
   *
   * @param scanOpts Options for the underlying `Scan` operation.
   * @returns The items, if found.
   */
  readonly scan = async (scanOpts: ScanOpts = {}): Promise<Array<ItemType>> => {
    const response = await this.ddbClient.scan({
      ...(scanOpts ?? {}),
      TableName: this.tableName,
    });

    const items = response?.Items;

    // If `items` is undefined, return an empty array instead of undefined
    return this.processItemData.fromDB(items ?? []);
  };

  // INSTANCE METHOD UTILS:

  /**
   * Item-transforming action sets grouped by data flow directionality.
   *
   * | `Method` | Description                                                     | Read/Write Usage                   |
   * | :------- | :-------------------------------------------------------------: | :--------------------------------: |
   * | `toDB`   | Actions executed on objects being _sent to_ the database.       | Only used for _writes_             |
   * | `fromDB` | Actions executed on objects being _returned from_ the database. | Used for both _reads_ AND _writes_ |
   */
  readonly processItemData = {
    /**
     * This method applies `toDB` IO-Actions to the provided `itemData` for DB write operations.
     * @param itemData The item(s) being sent to the database.
     * @param ioBehavioralOpts Boolean options for controlling the behavior of IO-Actions.
     * @returns The item(s) after being processed by the IO-Actions.
     */
    toDB: <ItemData extends OneOrMoreMaybePartialItems<ItemType>>(
      itemData: ItemData,
      {
        shouldSetDefaults = true,
        shouldTransformItem = true,
        shouldValidateItem = true,
        shouldCheckRequired = true,
      }: IOBehavioralOpts = {}
    ) => {
      return this.applyActionSetToItemData<ItemData, ItemType, DdbItemType>(
        Array.isArray(itemData) ? [...itemData] : { ...itemData }, // dereferenced copy
        {
          shouldSetDefaults,
          shouldTransformItem,
          shouldValidateItem,
          shouldCheckRequired,
        },
        "toDB"
      );
    },
    /**
     * This method applies `fromDB` IO-Actions to the provided `itemData` for DB R/W operations.
     * @param itemData The item(s) being returned from the database.
     * @param ioBehavioralOpts Boolean options for controlling the behavior of IO-Actions.
     * @returns The item(s) after being processed by the IO-Actions.
     */
    fromDB: <ItemData extends OneOrMoreMaybePartialItems<DdbItemType>>(
      itemData: ItemData,
      { shouldTransformItem = true }: IOBehavioralOpts = {}
    ) => {
      return this.applyActionSetToItemData<ItemData, DdbItemType, ItemType>(
        Array.isArray(itemData) ? [...itemData] : { ...itemData }, // dereferenced copy
        { shouldTransformItem },
        "fromDB"
      );
    },
  };

  /**
   * This method obtains and calls IO-Actions for a given action set, and handles type coercion.
   */
  private readonly applyActionSetToItemData = <
    ItemData extends BaseItem | Array<BaseItem>,
    BaseItemType extends BaseItem,
    ItemTypeToReturn extends BaseItem,
  >(
    itemData: ItemData,
    {
      shouldSetDefaults = true,
      shouldTransformItem = true,
      shouldValidateItem = true,
      shouldCheckRequired = true,
    } = {},
    ioDirection: IODirection
  ) => {
    // Get list of ioActions to apply to item/items
    const ioActions = this.getActionsSet[ioDirection](
      {
        ioDirection,
        modelName: this.modelName,
        schema: this.schema,
        schemaEntries: this.schemaEntries,
        schemaOptions: this.schemaOptions,
        attributesToAliasesMap: this.attributesToAliasesMap,
        aliasesToAttributesMap: this.aliasesToAttributesMap,
      },
      { shouldSetDefaults, shouldTransformItem, shouldValidateItem, shouldCheckRequired }
    );

    // Define reducer fn for applying ioActions to item/items
    const itemDataReducer: Parameters<typeof ioActions.reduce<ItemData>>[0] = !Array.isArray(
      itemData
    )
      ? (itemAccum: ItemData, ioAction) => {
          return ioAction(itemAccum satisfies BaseItem);
        }
      : (batchItemsAccum: ItemData, ioAction) => {
          return (batchItemsAccum satisfies Array<BaseItem>).map((item) => ioAction(item));
        };

    // Call reducer, return result
    return ioActions.reduce(itemDataReducer, itemData) as AscertainItemProcessingReturnType<
      ItemData,
      BaseItemType,
      ItemTypeToReturn
    >;
  };

  // DATABASE I/O ACTION SETS:

  private readonly getActionsSet: Record<
    IODirection,
    (ioContext: IOActionContext, opts?: IOBehavioralOpts) => Array<IOActionSetFn>
  > = {
    toDB: (
      ioContext,
      {
        shouldSetDefaults = true,
        shouldTransformItem = true,
        shouldValidateItem = true,
        shouldCheckRequired = true,
      } = {}
    ) => {
      return [
        // Alias Mapping
        (item) => ioActions.aliasMapping(item, ioContext),
        // Apply Defaults
        ...(shouldSetDefaults
          ? ([(item) => ioActions.setDefaults(item, ioContext)] satisfies [IOActionSetFn])
          : []),
        // Attribute-level transformValue.toDB
        (item) => ioActions.transformValues(item, ioContext),
        // Schema-level transformItem.toDB
        ...(shouldTransformItem
          ? ([(item) => ioActions.transformItem(item, ioContext)] satisfies [IOActionSetFn])
          : []),
        // Type Checking
        (item) => ioActions.typeChecking(item, ioContext),
        // Attribute-level Validation
        (item) => ioActions.validate(item, ioContext),
        // Item-level Validation
        ...(shouldValidateItem
          ? ([(item) => ioActions.validateItem(item, ioContext)] satisfies [IOActionSetFn])
          : []),
        // Convert JS Types
        (item) => ioActions.convertJsTypes(item, ioContext),
        // Check Required
        ...(shouldCheckRequired
          ? ([(item) => ioActions.checkRequired(item, ioContext)] satisfies [IOActionSetFn])
          : []),
      ];
    },
    fromDB: (ioContext, { shouldTransformItem = true } = {}) => [
      // Convert JS Types
      (item) => ioActions.convertJsTypes(item, ioContext),
      // Attribute-level transformValue.fromDB
      (item) => ioActions.transformValues(item, ioContext),
      // Schema-level transformItem.fromDB
      ...(shouldTransformItem
        ? ([(item) => ioActions.transformItem(item, ioContext)] satisfies [IOActionSetFn])
        : []),
      // Alias Mapping
      (item) => ioActions.aliasMapping(item, ioContext),
    ],
  };

  /**
   * This private Model method takes key-args from public methods like `Model.getItem`,
   * unaliases the keys, and applies defaults to the key-args if necessary, thereby
   * allowing the calling method to only require the _necessary_ keys. For example, if
   * the `sk` value is derived using a `default` function that returns a string using the
   * `pk` value, then the caller only needs to provide the `pk`.
   */
  private readonly processKeyArgs = (primaryKeyArgs: ItemKeys) => {
    // Unalias primaryKeyArgs and apply defaults
    return [this.tableHashKey, this.tableRangeKey].reduce(
      (args, keyAttrName) => {
        // See if args contains keyAttrName
        if (!Object.prototype.hasOwnProperty.call(args, keyAttrName)) {
          // See if keyAttrName has an alias
          const keyAlias = this.attributesToAliasesMap?.[keyAttrName];

          if (keyAlias && hasKey(args, keyAlias)) {
            // If args contains keyAttrName's alias, unalias it.
            args[keyAttrName] = args[keyAlias];
            delete args[keyAlias];
          } else if (hasKey(this.schema[keyAttrName], "default")) {
            /* At this point, we know args contains neither keyAttrName nor its alias. As
            a fallback, keyAttrName's `default` is used if one is defined in the schema. */
            const attrDefault = this.schema[keyAttrName].default;
            args[keyAttrName] = typeof attrDefault === "function" ? attrDefault(args) : attrDefault;
          } else {
            // If there's no key value, and there's no default, throw an error.
            throw new ItemInputError(
              `Missing required key attribute "${keyAlias || keyAttrName}".`
            );
          }
        }
        return args;
      },
      { ...primaryKeyArgs }
    );
  };
}
