import { isType, InvalidExpressionError } from "../../utils/index.js";
import type { WhereQueryOperator, WhereQueryComparand } from "./types/index.js";

/**
 * Assertion type-guard that ensures the `comparandValue` is valid for the given `operator`.
 *
 * @param operator The WhereQuery expression operator.
 * @param comparandValue The value to check.
 * @throws {InvalidExpressionError} if the value is not a valid comparand for the operator.
 */
export function assertIsValidWhereQueryComparand<Operator extends WhereQueryOperator>(
  operator: Operator,
  comparandValue: unknown
): asserts comparandValue is WhereQueryComparand<Operator> {
  // Ensure the comparandValue is a valid comparand for the operator
  if (operator === "beginsWith") {
    // For "beginsWith", the comparandValue must be a string.
    if (!isType.string(comparandValue)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: comparandValue,
        invalidValueDescription: "WhereQuery comparison value",
        problem: `The value provided to "beginsWith" is not of type "string"`,
      });
    }
  } else if (operator === "between") {
    // For "between", comparandValue must be `[string, string]` or `[number, number]`
    if (
      !isType.array(comparandValue)
      || comparandValue.length !== 2
      || !(
        (isType.string(comparandValue[0]) && isType.string(comparandValue[1]))
        || (isType.number(comparandValue[0]) && isType.number(comparandValue[1]))
      )
    ) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: comparandValue,
        invalidValueDescription: "WhereQuery comparison value",
        problem: `The value provided to "between" is not of type "[string, string]" nor "[number, number]"`,
      });
    }
  } else if (["eq", "lt", "lte", "gt", "gte"].includes(operator)) {
    // If the operator is one of these, comparandValue must be a string or number
    if (!isType.string(comparandValue) && !isType.number(comparandValue)) {
      throw new InvalidExpressionError({
        expressionName: "KeyConditionExpression",
        invalidValue: comparandValue,
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
}
