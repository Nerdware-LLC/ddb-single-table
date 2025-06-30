import type { DdbClientFieldParserConstructorParameters } from "./DdbClientFieldParserConstructorParameters.js";
import type { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { Simplify } from "type-fest";

/**
 * `DdbClientWrapper` class constructor params.
 */
export type DdbClientWrapperConstructorParameters = Simplify<
  {
    /** A {@link DynamoDBClient} instance. */
    ddbClient: DynamoDBClient;
  } & DdbClientFieldParserConstructorParameters
>;
