import type { MarshallingConfigsParam } from "./MarshallingConfigs.js";
import type { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { Simplify } from "type-fest";

/**
 * `DdbClientWrapper` class constructor params.
 */
export type DdbClientWrapperConstructorParams = Simplify<
  {
    /** The name of the DynamoDB table. */
    tableName: string;
    /** A {@link DynamoDBClient} instance. */
    ddbClient: DynamoDBClient;
  } & MarshallingConfigsParam
>;
