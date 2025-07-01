import { isPlainObject } from "@nerdware/ts-type-safety-utils";
import { InvalidExpressionError } from "../../utils/index.js";
import { getNormalizedComparisonMeta } from "./getNormalizedComparisonMeta.js";
import { WHERE_QUERY_OPERATOR_TO_EXPRESSION } from "./whereQueryOperatorToExpression.js";
import type { WhereQueryParameter } from "./types/index.js";
import type { ClientWrapperQueryInput } from "../../DdbClientWrapper/types/index.js";
import type { BaseItem, UnknownItem } from "../../types/index.js";

/**
 * This function converts `WhereQuery` objects into the following `QueryCommand` arguments:
 *
 * - `KeyConditionExpression`
 * - `ExpressionAttributeNames`
 * - `ExpressionAttributeValues`
 */
export const convertWhereQueryToSdkQueryArgs = <ItemParams extends UnknownItem = BaseItem>({
  where,
}: WhereQueryParameter<ItemParams>) => {
  // Ensure `where` is a plain Record-like object
  if (!isPlainObject(where)) {
    throw new InvalidExpressionError({
      expressionName: "KeyConditionExpression",
      invalidValue: where,
      invalidValueDescription: `"where" value`,
      problem: "Expected an object with enumerable properties, but received",
    });
  }

  // Ensure there are not more than 2 keys in the where object
  const whereQueryKeys = Object.keys(where);

  if (whereQueryKeys.length > 2) {
    throw new InvalidExpressionError({
      expressionName: "KeyConditionExpression",
      invalidValue: where,
      invalidValueDescription: "WhereQuery object",
      problem: `KeyConditionExpressions can only include hash and sort keys, but the WhereQuery object contains more than two keys`,
    });
  }

  // Process whereQuery to derive the KCE, EAN, and EAV:

  let KeyConditionExpression = "";
  const ExpressionAttributeNames: ClientWrapperQueryInput["ExpressionAttributeNames"] = {};
  const ExpressionAttributeValues: ClientWrapperQueryInput["ExpressionAttributeValues"] = {};

  for (let i = 0; i < whereQueryKeys.length; i++) {
    const attrName = whereQueryKeys[i];
    const whereQueryComparison = where[attrName]!; // Non-null assertion since we know the key exists

    // Get the operator and comparand to use in the expression
    const { operator, comparand } = getNormalizedComparisonMeta(attrName, whereQueryComparison);

    // Update ExpressionAttributeNames
    const eanToken = `#${attrName}`;
    ExpressionAttributeNames[eanToken] = attrName;

    // Update ExpressionAttributeValues, and get the KCE clause
    let kceClause: string;
    if (operator === "between") {
      // For "between", the comparand is an array, so we need to add 2 KV-pairs to EAV
      const [lowerBoundComparand, upperBoundComparand] = comparand;
      const lowerBoundEavToken = `:${attrName}LowerBound`;
      const upperBoundEavToken = `:${attrName}UpperBound`;
      ExpressionAttributeValues[lowerBoundEavToken] = lowerBoundComparand;
      ExpressionAttributeValues[upperBoundEavToken] = upperBoundComparand;
      kceClause = WHERE_QUERY_OPERATOR_TO_EXPRESSION[operator](eanToken, [
        lowerBoundEavToken,
        upperBoundEavToken,
      ]);
    } else {
      const eavToken = `:${attrName}`;
      ExpressionAttributeValues[eavToken] = comparand;
      kceClause = WHERE_QUERY_OPERATOR_TO_EXPRESSION[operator](eanToken, [eavToken]);
    }
    // Update the KeyConditionExpression
    KeyConditionExpression += KeyConditionExpression.length === 0 ? kceClause : ` AND ${kceClause}`;
  }

  // If neither are equality clauses, throw an error (KCE requires at least 1 equality clause)
  if (!/\s=\s/.test(KeyConditionExpression)) {
    throw new InvalidExpressionError({
      expressionName: "KeyConditionExpression",
      invalidValue: where,
      invalidValueDescription: "WhereQuery object",
      problem: `KeyConditionExpressions must include an equality check on a table/index hash key`,
    });
  }

  return {
    KeyConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
};
