import type { Table } from "./Table.js";
import type {
  DdbClientWrapperConstructorParams,
  CreateTableInput,
} from "../DdbClientWrapper/types/index.js";
import type { Model } from "../Model/Model.js";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  ModelSchemaOptions,
  MergeModelAndTableKeysSchema,
} from "../Schema/types/index.js";
import type { BaseItem, ItemTypeFromSchema } from "../types/index.js";
import type { Simplify, Except } from "type-fest";

/**
 * Constructor params for the {@link Table} class.
 */
export type TableConstructorParams<TableKeysSchema extends TableKeysSchemaType> = Simplify<
  {
    tableName: string;
    tableKeysSchema: TableKeysSchema;
    logger?: (str: string) => void;
  } & DdbClientWrapperConstructorParams
>;

/**
 * An instance of the {@link Table} class.
 */
export type TableInstance<TableKeysSchema extends TableKeysSchemaType> = InstanceType<
  typeof Table<TableKeysSchema>
>;

/**
 * A config object specifying the {@link Table}'s keys and indexes.
 */
export type TableKeysAndIndexes = {
  tableHashKey: string;
  tableRangeKey?: string | undefined;
  /** A map of DynamoDB table index names to their respective config objects. */
  indexes?:
    | {
        [indexName: string]: {
          name: string;
          type: "GLOBAL" | "LOCAL";
          indexPK: string;
          indexSK?: string;
        };
      }
    | undefined;
};

/**
 * The `createModel` method of {@link Table} class instances.
 */
export type TableCreateModelMethod<TableKeysSchema extends TableKeysSchemaType> = <
  ModelSchema extends ModelSchemaType<TableKeysSchema>,
  ItemType extends BaseItem = ItemTypeFromSchema<
    MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>
  >,
>(
  modelName: string,
  modelSchema: ModelSchema,
  modelSchemaOptions?: ModelSchemaOptions
) => InstanceType<
  typeof Model<MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>, ItemType>
>;

/**
 * Params which govern the behavior of the `table.ensureTableIsActive()` method.
 */
export type EnsureTableIsActiveParams = {
  /** The max number of attempts that should be made to connect to the table (default: 20). */
  maxRetries?: number;
  /** The number of seconds to wait in between connection attempts (default: 1). */
  frequency?: number;
  /** The number of seconds to wait until the fn throws a connection timeout error (default: 30). */
  timeout?: number;
  /**
   * Whether the table should be created if it does not yet exist. This can be an object with
   * `CreateTable` arguments, or `true` to create a table with default `CreateTable` arguments,
   * or `false` to disable table creation. If the table does not exist and this parameter is not
   * provided or is `false`, the function will throw an error.
   */
  createIfNotExists?: boolean | TableCreateTableParameters;
};

/**
 * Params for the `table.createTable()` method.
 */
export type TableCreateTableParameters = Simplify<
  Except<
    CreateTableInput,
    | "TableName" //              provided by the Table instance's this.tableName prop
    | "KeySchema" //              ascertained from the TableKeysSchema
    | "AttributeDefinitions" //   ascertained from the TableKeysSchema
    | "GlobalSecondaryIndexes" // ascertained from the TableKeysSchema
    | "LocalSecondaryIndexes" //  ascertained from the TableKeysSchema
    | "BillingMode" //            overridden below (replaces `string` with a union of valid values)
  > & {
    BillingMode?: "PROVISIONED" | "PAY_PER_REQUEST";
  }
>;
