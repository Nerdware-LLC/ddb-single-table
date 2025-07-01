import type { WhereQueryOperator } from "./types/index.js";

/**
 * A dictionary of `WhereQuery` operator methods, each of which returns a string
 * in the operator's respective format for DynamoDB expressions.
 */
export const WHERE_QUERY_OPERATOR_TO_EXPRESSION: {
  readonly [Operator in WhereQueryOperator]: (
    /** A key of `ExpressionAttributeNames` */
    eanKey: string,
    /** A tuple of 1-2 keys of `ExpressionAttributeValues` */
    eavKeys: Operator extends "between" ? [string, string] : [string]
  ) => string;
} = {
  eq: (eanKey, eavKeys) => `${eanKey} = ${eavKeys[0]}`,
  lt: (eanKey, eavKeys) => `${eanKey} < ${eavKeys[0]}`,
  lte: (eanKey, eavKeys) => `${eanKey} <= ${eavKeys[0]}`,
  gt: (eanKey, eavKeys) => `${eanKey} > ${eavKeys[0]}`,
  gte: (eanKey, eavKeys) => `${eanKey} >= ${eavKeys[0]}`,
  beginsWith: (eanKey, eavKeys) => `begins_with( ${eanKey}, ${eavKeys[0]} )`,
  between: (eanKey, eavKeys) => `${eanKey} BETWEEN ${eavKeys[0]} AND ${eavKeys[1]}`,
};
