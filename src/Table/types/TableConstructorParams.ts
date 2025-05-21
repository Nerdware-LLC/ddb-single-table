import type { TableKeysSchemaType } from "../../Schema/types/index.js";
import type { MarshallingConfigs } from "../../utils/index.js";
import type { DynamoDBClient } from "@aws-sdk/client-dynamodb";

/**
 * Constructor params for creating a new `Table` instance.
 */
export type TableConstructorParams<
  TableKeysSchema extends TableKeysSchemaType = TableKeysSchemaType,
> = {
  /** The name of the DynamoDB table. */
  tableName: string;
  /** The schema of the table's primary and sort keys. */
  tableKeysSchema: TableKeysSchema;
  /** A {@link DynamoDBClient} instance. */
  ddbClient: DynamoDBClient;
  /** Configs for controlling the default marshalling/unmarshalling behavior. */
  marshallingConfigs?: MarshallingConfigs | undefined;
  /** A custom function to use for logging (defaults to `console.info`). */
  logger?: TableLogFn;
};

export type TableLogFn = (str: string) => void;
