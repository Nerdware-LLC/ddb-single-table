import { createTable } from "./createTable";
import { ensureTableIsActive } from "./ensureTableIsActive";
import { DdbClientWrapper } from "../DdbClientWrapper";
import { Model } from "../Model";
import { TableKeysSchema } from "../Schema";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  ModelSchemaOptions,
  MergeModelAndTableKeysSchema,
} from "../Schema";
import type { BaseItem, ItemCreationParameters, ItemTypeFromSchema } from "../types";
import type { TableConstructorParams, TableKeysAndIndexes, TableCreateModelMethod } from "./types";

/**
 * `Table` provides an easy-to-use API for managing your DynamoDB table and the
 * {@link Model | Models } that use it. It is the primary entry point for DDBST.
 *
 * @class Table
 * @param tableName - The name of the DynamoDB table.
 * @param tableKeysSchema - The schema of the table's primary and sort keys.
 * @param ddbClient - Either an existing DynamoDBClient instance, or arguments for instantiating a new one.
 * @param marshallingConfigs - Marshalling configs for the DynamoDBDocumentClient instance.
 * @param logger - A custom function to use for logging (defaults to `console.info`).
 */
export class Table<TKSchema extends TableKeysSchemaType> implements TableKeysAndIndexes {
  // INSTANCE PROPERTIES:
  readonly tableName: string;
  readonly tableKeysSchema: TKSchema;
  readonly tableHashKey: TableKeysAndIndexes["tableHashKey"];
  readonly tableRangeKey?: TableKeysAndIndexes["tableRangeKey"];
  readonly indexes?: TableKeysAndIndexes["indexes"];
  readonly ddbClient: DdbClientWrapper;
  readonly logger: (str: string) => void;
  isTableActive: boolean;

  constructor({
    tableName,
    tableKeysSchema,
    ddbClient = {},
    marshallingConfigs = {},
    logger = console.info,
  }: TableConstructorParams<TKSchema>) {
    // Validate the TableKeysSchema and obtain the table's keys+indexes
    const { tableHashKey, tableRangeKey, indexes } = TableKeysSchema.validate(tableKeysSchema);

    this.tableName = tableName;
    this.tableKeysSchema = tableKeysSchema;
    this.isTableActive = false;
    this.logger = logger;
    this.tableHashKey = tableHashKey;
    this.tableRangeKey = tableRangeKey;
    this.indexes = indexes;
    this.ddbClient = new DdbClientWrapper({ ddbClient, marshallingConfigs });
  }

  // INSTANCE METHODS:

  /** A `DescribeTable` wrapper for Table instances which call the method with their `tableName`. */
  readonly describeTable = async () => {
    return await this.ddbClient.describeTable({ TableName: this.tableName });
  };

  readonly createTable = createTable;
  readonly ensureTableIsActive = ensureTableIsActive;

  /**
   * Returns a validated ModelSchema with the TableKeysSchema merged in. Use this method to create a
   * ModelSchema which can be provided to the `ItemTypeFromSchema` generic type-gen util to produce
   * a complete Model-item type, even if the ModelSchema does not specify the table's keys.
   */
  readonly getModelSchema = <ModelSchema extends ModelSchemaType<TKSchema>>(
    modelSchema: ModelSchema
  ) => {
    return TableKeysSchema.getMergedModelSchema<TKSchema, ModelSchema>({
      tableKeysSchema: this.tableKeysSchema,
      modelSchema,
    });
  };

  /**
   * Returns a new Model instance. This method simply offers a more concise alternative to invoking
   * the bare Model constructor, i.e., the two examples below are equivalent:
   * ```ts
   * // A Table instance for both examples:
   * const table = new Table({ ... table constructor args ... });
   *
   * // Example 1 using this method:
   * const fooModel_1 = table.createModel(
   *   "FooModel",
   *   fooModelSchema,
   *   {
   *     // Optional ModelSchemaOptions
   *     allowUnknownAttributes: true
   *     // Using the createModel method, there's no need to provide
   *     // Model properties which are provided by the table, like
   *     // `"tableName"`, `"tableHashKey"`, `"tableRangeKey"`, etc.
   *   }
   * );
   *
   * // Example 2 does the same as above, only with the bare Model constructor:
   * const fooModel_2 = new Model(
   *   "FooModel",
   *   fooModelSchema,
   *   {
   *     // Same ModelSchemaOptions as above
   *     allowUnknownAttributes: true,
   *     ...table
   *     // When using the bare Model constructor, table properties like
   *     // `"tableName"`, `"tableHashKey"`, `"tableRangeKey"`, etc., must
   *     // be explicitly provided. An easy way to do this is to simply
   *     // spread a table instance object as is shown here.
   *   }
   * );
   * ```
   */
  readonly createModel: TableCreateModelMethod<TKSchema> = <
    ModelSchema extends ModelSchemaType<TKSchema>,
    ItemType extends BaseItem = ItemTypeFromSchema<
      MergeModelAndTableKeysSchema<TKSchema, ModelSchema>
    >,
    ItemCreationParams extends BaseItem = ItemCreationParameters<
      MergeModelAndTableKeysSchema<TKSchema, ModelSchema>
    >,
  >(
    modelName: string,
    modelSchema: ModelSchema,
    modelSchemaOptions: ModelSchemaOptions = {}
  ) => {
    return new Model<
      MergeModelAndTableKeysSchema<TKSchema, ModelSchema>,
      ItemType,
      ItemCreationParams
    >(modelName, this.getModelSchema(modelSchema), {
      ...modelSchemaOptions,
      tableName: this.tableName,
      tableHashKey: this.tableHashKey,
      tableRangeKey: this.tableRangeKey,
      indexes: this.indexes,
      ddbClient: this.ddbClient,
    });
  };
}
