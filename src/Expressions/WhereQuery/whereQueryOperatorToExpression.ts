import type { WhereQueryOperator } from "./types.js";

/**
 * A dict of `WhereQuery` operator methods, each of which returns a string
 * in the operator's respective format for DynamoDB expressions.
 *
 * - `namesKey` is a key of ExpressionAttributeNames
 * - `valuesKeys` is a tuple of 1-2 keys of ExpressionAttributeValues
 *   - `between` operations require 2 EAV keys
 *   - all other operations require 1 EAV key
 *
 * @internal
 */
export const WHERE_QUERY_OPERATOR_TO_EXPRESSION = {
  eq: (namesKey: string, valuesKeys: string[]) => `${namesKey} = ${valuesKeys[0]}`,
  lt: (namesKey: string, valuesKeys: string[]) => `${namesKey} < ${valuesKeys[0]}`,
  lte: (namesKey: string, valuesKeys: string[]) => `${namesKey} <= ${valuesKeys[0]}`,
  gt: (namesKey: string, valuesKeys: string[]) => `${namesKey} > ${valuesKeys[0]}`,
  gte: (namesKey: string, valuesKeys: string[]) => `${namesKey} >= ${valuesKeys[0]}`,
  beginsWith: (namesKey: string, valuesKeys: string[]) =>
    `begins_with( ${namesKey}, ${valuesKeys[0]} )`,
  between: (namesKey: string, valuesKeys: string[]) =>
    `${namesKey} BETWEEN ${valuesKeys[0]} AND ${valuesKeys[1]}`,
} as const satisfies Record<
  WhereQueryOperator,
  (namesKey: string, valuesKeys: Array<string>) => string
>;
