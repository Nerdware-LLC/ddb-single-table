import type { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { TranslateConfig } from "@aws-sdk/lib-dynamodb";
import type { Simplify } from "type-fest";

/**
 * `DdbClientWrapper` class constructor params.
 */
export type DdbClientWrapperConstructorParams = {
  /**
   * Can be either an existing {@link DynamoDBClient} instance, or
   * {@link DynamoDBClientConfig|arguments} for instantiating a new one.
   */
  ddbClient?: DynamoDBClient | DynamoDBClientConfig;
  /**
   * Marshalling/unmarshalling configs for the DynamoDBDocumentClient instance.
   * @see {@link TranslateConfig}
   */
  marshallingConfigs?: Simplify<TranslateConfig>;
};
