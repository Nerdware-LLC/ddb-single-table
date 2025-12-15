import { InvalidExpressionError, isType } from "../../utils/index.js";
import { assertIsValidWhereQueryComparand } from "./assertIsValidWhereQueryComparand.js";
import { isValidWhereQueryOperator } from "./isValidWhereQueryOperator.js";
import type { ItemWhereQuery, WhereQueryOperator, WhereQueryComparand } from "./types/index.js";
import type { ValueOf } from "type-fest";

/**
 * A type representing the meta object returned by `getNormalizedComparisonMeta()`.
 * It contains the `operator` and `comparand` for a given `WhereQuery` comparison.
 */
type ComparisonMetaObject = ValueOf<{
  [Op in WhereQueryOperator]: { operator: Op; comparand: WhereQueryComparand<Op> };
}>;

/**
 * This function takes a key-value pair from an {@link ItemWhereQuery} object,
 * validates the values it contains, and if they're valid, returns the appropriate
 * comparison `operator` and `comparand` to use in the `KeyConditionExpression`.
 *
 * @returns An {@link ComparisonMetaObject} containing the `operator` and `comparand` for the given `WhereQuery` comparison.
 * @throws {InvalidExpressionError} if the args are invalid.
 */
export const getNormalizedComparisonMeta = (
  attrName: keyof ItemWhereQuery,
  whereQueryComparison: ValueOf<ItemWhereQuery>
): ComparisonMetaObject => {
  // Determine the operator and comparand to use in the expression
  let returnedComparisonMeta: ComparisonMetaObject;

  // First check if the comparison is an object
  if (!isType.map(whereQueryComparison)) {
    // If whereQueryComparison is not an object, ensure it's a string or number (short-hand "eq")
    if (!isType.string(whereQueryComparison) && !isType.number(whereQueryComparison)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: whereQueryComparison,
        invalidValueDescription: "WhereQuery value",
        problem: `WhereQuery value for attribute "${attrName}" contains an invalid value for short-hand "eq" expressions`,
      });
    }
    // If it's a string or number, it's a short-hand "eq", and the comparand is the whereQueryComparison value
    returnedComparisonMeta = {
      operator: "eq",
      comparand: whereQueryComparison,
    };
  } else {
    // If the value IS an object, ensure it's a valid WhereQuery comparison object.
    // First, ensure the object contains exactly one K-V pair.
    const comparisonOperatorKeys = Object.keys(whereQueryComparison);

    if (comparisonOperatorKeys.length !== 1) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: whereQueryComparison,
        invalidValueDescription: "WhereQuery comparison object",
        problem:
          `KeyConditionExpressions can only include one logical operator per key, but the `
          + `WhereQuery object for attribute "${attrName}" contains more than one operator`,
      });
    }

    // Extract the K-V pair from the lone entry
    const comparisonOperator = comparisonOperatorKeys[0];

    // Ensure the key is a valid operator
    if (!isValidWhereQueryOperator(comparisonOperator)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: comparisonOperator,
        invalidValueDescription: "WhereQuery comparison operator",
        problem: `An invalid comparison operator was provided for attribute "${attrName}"`,
      });
    }

    const comparisonComparand = whereQueryComparison[comparisonOperator];

    // Ensure the value is a valid comparand for the operator
    assertIsValidWhereQueryComparand(comparisonOperator, comparisonComparand);

    // If we've made it this far, the operator and comparand are valid.
    returnedComparisonMeta = {
      operator: comparisonOperator,
      comparand: comparisonComparand,
    } as ComparisonMetaObject;
  }

  // Return the comparison-meta object
  return returnedComparisonMeta;
};
