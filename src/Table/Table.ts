import { DdbClientWrapper } from "../DdbClientWrapper/index.js";
import { Model } from "../Model/Model.js";
import { TableKeysSchema } from "../Schema/TableKeysSchema.js";
import { DEFAULT_MARSHALLING_CONFIGS } from "../utils/index.js";
import { createTable } from "./createTable.js";
import { ensureTableIsActive } from "./ensureTableIsActive.js";
import type { TableConstructorParams, TableKeysAndIndexes, TableLogFn } from "./types/index.js";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  ModelSchemaOptions,
  MergeModelAndTableKeysSchema,
} from "../Schema/types/index.js";
import type { BaseItem, ItemCreationParameters, ItemTypeFromSchema } from "../types/index.js";

/**
 * `Table` provides an easy-to-use API for managing your DynamoDB table and the
 * {@link Model|Models} that use it. It is the primary entry point for DDBST.
 */
export class Table<const TKSchema extends TableKeysSchemaType> implements TableKeysAndIndexes {
  // STATIC PROPERTIES:
  static readonly DEFAULT_MARSHALLING_CONFIGS = DEFAULT_MARSHALLING_CONFIGS;

  // INSTANCE PROPERTIES:
  readonly tableName: TableConstructorParams<TKSchema>["tableName"];
  readonly tableKeysSchema: TKSchema;
  readonly tableHashKey: TableKeysAndIndexes["tableHashKey"];
  readonly tableRangeKey?: TableKeysAndIndexes["tableRangeKey"];
  readonly indexes?: TableKeysAndIndexes["indexes"];
  /** A wrapper-class around the DynamoDB client instance which greatly simplifies DDB operations. */
  readonly ddb: DdbClientWrapper;
  readonly logger: TableLogFn;
  isTableActive: boolean;

  constructor({
    tableName,
    tableKeysSchema,
    ddbClient,
    marshallingConfigs,
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

    // Attach proc exit handler which calls destroy method
    process.on("exit", () => ddbClient.destroy());

    // DDB client wrapper
    this.ddb = new DdbClientWrapper({ ddbClient, tableName, marshallingConfigs });
  }

  // INSTANCE METHODS:

  readonly createTable = createTable;
  readonly ensureTableIsActive = ensureTableIsActive;

  /** A `DescribeTable` wrapper for Table instances which call the method with their `tableName`. */
  readonly describeTable = async () => {
    return await this.ddb.describeTable({ TableName: this.tableName });
  };

  /**
   * Returns a validated ModelSchema with the TableKeysSchema merged in. Use this method to create a
   * ModelSchema which can be provided to the `ItemTypeFromSchema` generic type-gen util to produce
   * a complete Model-item type, even if the ModelSchema does not specify the table's keys.
   */
  readonly getModelSchema = <const ModelSchema extends ModelSchemaType<TKSchema>>(
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
  readonly createModel = <
    const ModelSchema extends ModelSchemaType<TKSchema>,
    const ItemType extends BaseItem = ItemTypeFromSchema<
      MergeModelAndTableKeysSchema<TKSchema, ModelSchema>
    >,
    const ItemCreationParams extends BaseItem = ItemCreationParameters<
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
      ddb: this.ddb,
      tableName: this.tableName,
      tableHashKey: this.tableHashKey,
      ...(this.tableRangeKey && { tableRangeKey: this.tableRangeKey }),
      ...(this.indexes && { indexes: this.indexes }),
    });
  };
}
