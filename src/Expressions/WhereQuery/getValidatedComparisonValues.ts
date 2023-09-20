import { isValidWhereQueryOperator, validateWhereQueryComparand } from "./isValidWhereQuery";
import { InvalidExpressionError, isType } from "../../utils";
import type { WhereQueryOperator, WhereQueryComparand } from "./types";

/**
 * This function takes a K-V pair from a `WhereQuery` object, validates the values,
 * and if they're valid, returns the appropriate comparison operator and comparand
 * to use in the `KeyConditionExpression`.
 *
 * @throws {@link InvalidExpressionError} if the args are invalid.
 * @internal
 */
export const getValidatedComparisonValues = (attrName: string, rawWhereQueryValue: unknown) => {
  // Determine the operator and comparand to use in the expression
  let operator: WhereQueryOperator;
  let comparand: WhereQueryComparand;

  // First check if the value is an object
  if (!isType.map(rawWhereQueryValue)) {
    // If rawWhereQueryValue is not an object, ensure it's a string or number
    if (!isType.string(rawWhereQueryValue) && !isType.number(rawWhereQueryValue)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: rawWhereQueryValue,
        invalidValueDescription: "WhereQuery value",
        problem: `WhereQuery value for attribute "${attrName}" contains an invalid value for short-hand "eq" expressions`,
      });
    }
    // If value is a string or number, the operator is "eq", and the comparand is the raw value.
    operator = "eq";
    comparand = rawWhereQueryValue;
  } else {
    // If the value IS an object, ensure it's a valid WhereQuery comparison object.

    // First, ensure the object contains exactly one K-V pair.
    const rawWhereQueryValueEntries = Object.entries(rawWhereQueryValue);

    if (rawWhereQueryValueEntries.length !== 1) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: rawWhereQueryValue,
        invalidValueDescription: "WhereQuery comparison object",
        problem:
          `KeyConditionExpressions can only include one logical operator per key, but the ` +
          `WhereQuery object for attribute "${attrName}" contains more than one operator`,
      });
    }

    // Extract the K-V pair from the lone entry
    const [whereKey, whereValue] = rawWhereQueryValueEntries[0];

    // Ensure the key is a valid operator
    if (!isValidWhereQueryOperator(whereKey)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: whereKey,
        invalidValueDescription: "WhereQuery comparison operator",
        problem: `An invalid comparison operator was provided for attribute "${attrName}"`,
      });
    }

    // Ensure the value is a valid comparand for the operator
    validateWhereQueryComparand(whereKey, whereValue);

    // If we've made it this far, the operator and comparand are valid.
    operator = whereKey;
    comparand = whereValue as WhereQueryComparand;
  }

  // Return the operator and comparand
  return { operator, comparand } as {
    // This type-cast ensures the 'comparand' is correctly typed for the operator.
    [Operator in WhereQueryOperator]: {
      operator: Operator;
      comparand: WhereQueryComparand<Operator>;
    };
  }[WhereQueryOperator];
};
