import type { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { TranslateConfig } from "@aws-sdk/lib-dynamodb";
import type { Simplify, Except } from "type-fest";
import type { CreateTableInput } from "../DdbClientWrapper";
import type { Model } from "../Model";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  ModelSchemaOptions,
  MergeModelAndTableKeysSchema,
  ItemTypeFromSchema,
} from "../types";

/**
 * `Table` class constructor params.
 */
export type TableCtorParams<TableKeysSchema extends TableKeysSchemaType> = {
  tableName: string;
  tableKeysSchema: TableKeysSchema;
  ddbClient?: DynamoDBClient;
  ddbClientConfigs?: Simplify<DynamoDBClientConfig>;
  marshallingConfigs?: Simplify<TranslateConfig>;
  logger?: (str: string) => void;
};

/**
 * A map of DynamoDB table index names to their respective config objects.
 */
export type TableIndexes = {
  [indexName: string]: {
    name: string;
    type: "GLOBAL" | "LOCAL";
    indexPK: string;
    indexSK?: string;
  };
};

/**
 * This type defines the `createModel` method of Table class instances.
 */
export type TableCreateModelMethod<TableKeysSchema extends TableKeysSchemaType> = <
  ModelSchema extends ModelSchemaType<TableKeysSchema>,
  ItemType extends Record<string, any> = ItemTypeFromSchema<
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
