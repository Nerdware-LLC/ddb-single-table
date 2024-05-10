import { getValidatedComparisonValues } from "./getValidatedComparisonValues.js";
import { InvalidExpressionError } from "../../utils/index.js";

describe("getValidatedComparisonValues()", () => {
  // short-hand eq
  test(`returns the operator and comparand for a short-hand "eq" expression with a string value`, () => {
    const result = getValidatedComparisonValues("mockAttrName", "value");
    expect(result).toStrictEqual({ operator: "eq", comparand: "value" });
  });
  test(`returns the operator and comparand for a short-hand "eq" expression with a number value`, () => {
    const result = getValidatedComparisonValues("mockAttrName", 10);
    expect(result).toStrictEqual({ operator: "eq", comparand: 10 });
  });
  test(`throws an InvalidExpressionError for a short-hand "eq" expression with an invalid value`, () => {
    [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
      expect(() =>
        getValidatedComparisonValues("mockAttrName", invalidValue)
      ).toThrowError(InvalidExpressionError); // prettier-ignore
    });
  });

  // eq, lt, lte, gt, gte
  ["eq", "lt", "lte", "gt", "gte"].forEach((operatorToTest) => {
    test(`returns the operator and comparand for an "${operatorToTest}" expression with a string value`, () => {
      const result = getValidatedComparisonValues("mockAttrName", { [operatorToTest]: "value" });
      expect(result).toStrictEqual({ operator: operatorToTest, comparand: "value" });
    });
    test(`returns the operator and comparand for an "${operatorToTest}" expression with a number value`, () => {
      const result = getValidatedComparisonValues("mockAttrName", { [operatorToTest]: 10 });
      expect(result).toStrictEqual({ operator: operatorToTest, comparand: 10 });
    });
    test(`throws an InvalidExpressionError for an "${operatorToTest}" expression with an invalid value`, () => {
      [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
        expect(() =>
          getValidatedComparisonValues("attr", { [operatorToTest]: invalidValue })
        ).toThrowError(InvalidExpressionError);
      });
    });
  });

  // beginsWith
  test(`returns the operator and comparand for a "beginsWith" expression with a string value`, () => {
    const result = getValidatedComparisonValues("attr", { beginsWith: "value" });
    expect(result).toStrictEqual({ operator: "beginsWith", comparand: "value" });
  });
  test(`throws an InvalidExpressionError for a "beginsWith" expression with an invalid value`, () => {
    [undefined, null, [], {}, true, NaN, 10].forEach((invalidValue) => {
      expect(() =>
        getValidatedComparisonValues("attr", { beginsWith: invalidValue })
      ).toThrowError(InvalidExpressionError); // prettier-ignore
    });
  });

  // between
  test(`returns the operator and comparand for a "between" expression with strings`, () => {
    const result = getValidatedComparisonValues("attr", { between: ["a", "z"] });
    expect(result).toStrictEqual({ operator: "between", comparand: ["a", "z"] });
  });
  test(`returns the operator and comparand for a "between" expression with numbers`, () => {
    const result = getValidatedComparisonValues("attr", { between: [1, 9] });
    expect(result).toStrictEqual({ operator: "between", comparand: [1, 9] });
  });
  test(`throws an InvalidExpressionError for a "between" expression with invalid values`, () => {
    // prettier-ignore
    [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
      expect(() => getValidatedComparisonValues("attr", { between: invalidValue })).toThrowError(InvalidExpressionError);
      expect(() => getValidatedComparisonValues("attr", { between: [invalidValue] })).toThrowError(InvalidExpressionError);
      expect(() => getValidatedComparisonValues("attr", { between: [invalidValue, "value"] })).toThrowError(InvalidExpressionError);
      expect(() => getValidatedComparisonValues("attr", { between: ["value", invalidValue] })).toThrowError(InvalidExpressionError);
      expect(() => getValidatedComparisonValues("attr", { between: [invalidValue, NaN] })).toThrowError(InvalidExpressionError);
      expect(() => getValidatedComparisonValues("attr", { between: [NaN, invalidValue] })).toThrowError(InvalidExpressionError);
    });
  });
  test(`throws an InvalidExpressionError for a "between" expression with valid values that are not the same type`, () => {
    expect(() => getValidatedComparisonValues("attr", { between: ["a", 1] })).toThrowError(InvalidExpressionError); // prettier-ignore
    expect(() => getValidatedComparisonValues("attr", { between: [1, "a"] })).toThrowError(InvalidExpressionError); // prettier-ignore
  });

  // destructive test case: multiple operators
  test(`throws an InvalidExpressionError when called with a "WhereQueryComparisonObject" containing 2+ operators`, () => {
    [
      { lt: "value" },
      { lte: "value" },
      { gt: "value" },
      { gte: "value" },
      { beginsWith: "value" },
      { between: ["a", "z"] },
    ].forEach((comparisonObject) => {
      expect(() =>
        getValidatedComparisonValues("attr", { ...comparisonObject, eq: "value" })
      ).toThrowError(/contains more than one operator/i);
    });
  });

  // destructive test case: invalid operator
  test(`throws an InvalidExpressionError when called with a key which is not a valid operator`, () => {
    ["BAD", "EQ", "begins_with", ""].forEach((nonOperatorValue) => {
      expect(() =>
        getValidatedComparisonValues("attr", { [nonOperatorValue]: "value" })
      ).toThrowError(/invalid comparison operator/i);
    });
  });
});
