import { InvalidExpressionError, isType } from "../../utils/index.js";
import type { WhereQueryComparisonObject, WhereQueryOperator } from "./types.js";

/**
 * Type-guard function for `WhereQueryOperator`.
 *
 * @param str The string to check.
 * @returns A boolean indicating whether the provided `str` is a valid `WhereQueryOperator`.
 */
export const isValidWhereQueryOperator = (str: string): str is WhereQueryOperator => {
  return (
    str === "eq" || str === "lt" || str === "lte" || str === "gt" || str === "gte" || str === "between" || str === "beginsWith" // prettier-ignore
  );
};

/**
 * Type-guard function for `WhereQueryComparand`.
 *
 * @param operator The WhereQuery expression operator.
 * @param value The value to check.
 * @returns A boolean indicating whether the provided `value` is a valid `WhereQueryComparand` for the provided `operator`.
 */
export const validateWhereQueryComparand = <Operator extends WhereQueryOperator>(
  operator: Operator,
  value: unknown
): value is Required<WhereQueryComparisonObject>[Operator] => {
  // Ensure the value is a valid comparand for the operator
  if (operator === "beginsWith") {
    // For "beginsWith", the value must be a string.
    if (!isType.string(value)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: value,
        invalidValueDescription: "WhereQuery comparison value",
        problem: `The value provided to "begins_with" is not of type "string"`,
      });
    }
  } else if (operator === "between") {
    // For "between", value must be `[string, string]` or `[number, number]`
    if (
      !isType.array(value) ||
      value.length !== 2 ||
      !(
        (isType.string(value[0]) && isType.string(value[1])) ||
        (isType.number(value[0]) && isType.number(value[1]))
      )
    ) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: value,
        invalidValueDescription: "WhereQuery comparison value",
        problem: `The value provided to "between" is not of type "[string, string]" nor "[number, number]"`,
      });
    }
  } else if (["eq", "lt", "lte", "gt", "gte"].includes(operator)) {
    // If the operator is one of these, value must be a string or number
    if (!isType.string(value) && !isType.number(value)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: value,
        invalidValueDescription: "WhereQuery comparison value",
        problem: `The value provided to "${operator}" is not of type "string" nor "number"`,
      });
    }
  } else {
    // Else the OPERATOR is not a valid WhereQuery operator (shouldn't happen here, but just in case)
    throw new InvalidExpressionError({
      expressionName: "KeyConditionExpression",
      invalidValue: operator,
      invalidValueDescription: "WhereQuery comparison operator",
      problem: "An invalid comparison operator was provided",
    });
  }

  // If we've made it this far, the comparand is valid.
  return true;
};
