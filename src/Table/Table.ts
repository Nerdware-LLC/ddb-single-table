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
  ItemInputType,
  ItemTypeFromSchema,
} from "../types";
import type { TableCtorParams, TableIndexes, TableCreateModelMethod } from "./types";

/**
 * Table is a wrapper around DdbClientWrapper that provides a higher-level interface for interacting
 * with a single DynamoDB table.
 *
 * #### Table Keys Schema
 *
 * The table's primary and sort keys are defined in the {@link tableKeysSchema} argument. When a new
 * `Table` instance is created, the following validations are performed on the `tableKeysSchema`:
 *
 *   1. Ensure all key/index attributes specify `isHashKey`, `isRangeKey`, or `index`.
 *   2. Ensure exactly 1 table hash key, and 1 table range key are specified.
 *   3. Ensure all key/index attribute `type`s are "string", "number", or "Buffer" (S/N/B in the DDB API).
 *   4. Ensure all key/index attributes are `required`.
 *   5. Ensure there are no duplicate index names.
 *   6. If tableConfigs.billingMode is "PAY_PER_REQUEST", ensure indexes don't set `throughput`.
 *
 * @class Table
 * @param tableName - The name of the DynamoDB table.
 * @param tableKeysSchema - The schema of the table's primary and sort keys.
 * @param tableConfigs - Configs for the table.
 * @param ddbClientConfigs - Configs for the DdbClientWrapper.
 * @param waitForActive - Configs for waiting for the table to become active.
 */
export class Table<TableKeysSchema extends TableKeysSchemaType> {
  // STATIC METHODS:
  static readonly validateTableKeysSchema = validateTableKeysSchema;

  // INSTANCE PROPERTIES:
  readonly tableName: string;
  readonly tableKeysSchema: TableKeysSchema;
  readonly tableHashKey: string;
  readonly tableRangeKey: string;
  /** Map of index configs which can be used to build `query` arguments. */
  readonly indexes: TableIndexes;
  readonly ddbClient: DdbClientWrapper;
  readonly logger: (str: string) => void;
  /** Whether the table is active and ready for use. */
  isTableActive: boolean;

  constructor({
    tableName,
    tableKeysSchema,
    ddbClient,
    ddbClientConfigs = {},
    marshallingConfigs = {},
    logger = console.info,
    // Validate the TableKeysSchema and obtain the table's keys+indexes
    const { tableHashKey, tableRangeKey, indexes } = TableKeysSchema.validate(tableKeysSchema);

    this.tableName = tableName;
    this.tableKeysSchema = tableKeysSchema;
    this.isTableActive = false;
    this.logger = logger;
    this.tableHashKey = tableHashKey;
    this.tableRangeKey = tableRangeKey;
    this.indexes = indexes;
    this.ddbClient = new DdbClientWrapper({
      ddbClient,
      ddbClientConfigs,
      marshallingConfigs,
    });
  }

  // INSTANCE METHODS:

  /**
   * A `DescribeTable` wrapper for Table instances which call the method with their respective
   * `tableName`.
   */
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
  readonly getModelSchema = <ModelSchema extends ModelSchemaType<TableKeysSchema>>(
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
  readonly createModel: TableCreateModelMethod<TableKeysSchema> = <
    ModelSchema extends ModelSchemaType<TableKeysSchema>,
    ItemType extends Record<string, any> = ItemTypeFromSchema<
      MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>
    >,
    ItemInput extends Record<string, any> = ItemInputType<
      MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>
    >,
  >(
    modelName: string,
    modelSchema: ModelSchema,
    modelSchemaOptions: ModelSchemaOptions = {}
  ) => {
    return new Model<
      MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>,
      ItemType,
      ItemInput
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
