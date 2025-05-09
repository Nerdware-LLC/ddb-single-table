import { isPlainObject } from "@nerdware/ts-type-safety-utils";
import { InvalidExpressionError } from "../../utils/index.js";
import { getValidatedComparisonValues } from "./getValidatedComparisonValues.js";
import { WHERE_QUERY_OPERATOR_TO_EXPRESSION } from "./whereQueryOperatorToExpression.js";
import type { WhereQueryComparisonObject } from "./types.js";
import type { QueryInput } from "../../DdbClientWrapper/types/index.js";
import type { BaseItem } from "../../types/index.js";

/**
 * This function converts `WhereQuery` objects into the following `QueryCommand`
 * arguments:
 *
 * - `KeyConditionExpression`
 * - `ExpressionAttributeNames`
 * - `ExpressionAttributeValues`
 */
export const convertWhereQueryToSdkQueryArgs = <ItemParams extends BaseItem = BaseItem>({
  where,
}: WhereQueryParams<ItemParams>) => {
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
  const ExpressionAttributeNames: QueryInput["ExpressionAttributeNames"] = {};
  const ExpressionAttributeValues: QueryInput["ExpressionAttributeValues"] = {};

  for (let i = 0; i < whereQueryKeys.length; i++) {
    const attrName = whereQueryKeys[i];
    const value = where[attrName];

    // Get the operator and comparand to use in the expression
    const { operator, comparand } = getValidatedComparisonValues(attrName, value);

    // Get the keys for ExpressionAttribute{Names,Values}
    const attrNamesToken = `#${attrName}`;
    const attrValuesToken = `:${attrName}`;

    // Update ExpressionAttributeNames
    ExpressionAttributeNames[attrNamesToken] = attrName;
    // Update ExpressionAttributeValues
    const eavKeysAdded: Array<string> = [];
    // For "between" operators, the comparand is an array, so we need to add 2 EAV
    if (operator === "between") {
      const [lowerBoundOperand, upperBoundOperand] = comparand;
      const lowerBoundEavToken = `${attrValuesToken}LowerBound`;
      const upperBoundEavToken = `${attrValuesToken}UpperBound`;
      ExpressionAttributeValues[lowerBoundEavToken] = lowerBoundOperand;
      ExpressionAttributeValues[upperBoundEavToken] = upperBoundOperand;
      eavKeysAdded.push(lowerBoundEavToken, upperBoundEavToken);
    } else {
      ExpressionAttributeValues[attrValuesToken] = comparand;
      eavKeysAdded.push(attrValuesToken);
    }

    // Get the KCE clause
    const keyConditionExpressionClause = WHERE_QUERY_OPERATOR_TO_EXPRESSION[operator](
      attrNamesToken,
      eavKeysAdded
    );

    // Add the clause to the accum
    KeyConditionExpression +=
      KeyConditionExpression.length === 0
        ? keyConditionExpressionClause
        : ` AND ${keyConditionExpressionClause}`;
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

/**
 * The `WhereQuery` param for {@link convertWhereQueryToSdkQueryArgs}.
 */
export type WhereQueryParams<ItemParams extends BaseItem = BaseItem> = {
  /**
   * `WhereQuery` is a flexible, dev-friendly syntax used to build `QueryCommand` args:
   * - `KeyConditionExpression`
   * - `ExpressionAttributeNames`
   * - `ExpressionAttributeValues`
   *
   * ```ts
   * // The `where` argument in this query contains 2 WhereQueryComparisonObjects:
   * const queryResults = await PersonModel.query({
   *   where: {
   *     name: { eq: "Foo" }, // "name = Foo"
   *     age: {
   *       between: [ 15, 30 ] // "age BETWEEN 15 AND 30"
   *     },
   *   }
   * });
   * ```
   */
  where?: ItemWhereQuery<ItemParams>;
};

/**
 * Keys of attribute names to {@link WhereQueryComparisonObject|WhereQuery objects}
 * or string/number primitive values. If primitives are provided, they are treated
 * as {@link WhereQueryComparisonObject.eq|eq} WhereQuery expressions.
 */
export type ItemWhereQuery<ItemParams extends BaseItem = BaseItem> = {
  [AttrName in keyof ItemParams]?: string | number | WhereQueryComparisonObject;
};
