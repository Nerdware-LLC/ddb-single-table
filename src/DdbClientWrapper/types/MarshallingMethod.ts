import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { MarshallingConfigs } from "./MarshallingConfigs.js";
import type { BaseItem } from "../../types/index.js";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

/**
 * A function that marshalls a JavaScript object into a DynamoDB `AttributeValue` object.
 */
export type MarshallingMethod = (
  data: BaseItem,
  options?: MarshallingConfigs["marshallOptions"]
) => Record<string, AttributeValue>;

/**
 * A function that unmarshalls a DynamoDB `AttributeValue` object into a JavaScript object.
 */
export type UnmarshallingMethod = (
  ...[data, options]: Parameters<typeof unmarshall> //
) => BaseItem;
