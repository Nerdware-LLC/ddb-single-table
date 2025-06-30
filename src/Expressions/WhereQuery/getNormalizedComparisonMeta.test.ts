import { InvalidExpressionError } from "../../utils/errors.js";
import { getNormalizedComparisonMeta } from "./getNormalizedComparisonMeta.js";
import type { WhereQueryOperator } from "./types/index.js";

describe("getNormalizedComparisonMeta()", () => {
  // short-hand eq
  test(`returns the operator and comparand for a short-hand "eq" expression with a string value`, () => {
    const result = getNormalizedComparisonMeta("mockAttrName", "value");
    expect(result).toStrictEqual({ operator: "eq", comparand: "value" });
  });
  test(`returns the operator and comparand for a short-hand "eq" expression with a number value`, () => {
    const result = getNormalizedComparisonMeta("mockAttrName", 10);
    expect(result).toStrictEqual({ operator: "eq", comparand: 10 });
  });
  test(`throws an InvalidExpressionError for a short-hand "eq" expression with an invalid value`, () => {
    [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
      expect(
        () => getNormalizedComparisonMeta("mockAttrName", invalidValue as any) //
      ).toThrowError(InvalidExpressionError);
    });
  });

  // eq, lt, lte, gt, gte
  (["eq", "lt", "lte", "gt", "gte"] as const satisfies Array<WhereQueryOperator>).forEach(
    (operatorToTest) => {
      test(`returns the operator and comparand for an "${operatorToTest}" expression with a string value`, () => {
        const result = getNormalizedComparisonMeta("fooAttr", { [operatorToTest]: "value" } as any);
        expect(result).toStrictEqual({ operator: operatorToTest, comparand: "value" });
      });
      test(`returns the operator and comparand for an "${operatorToTest}" expression with a number value`, () => {
        const result = getNormalizedComparisonMeta("fooAttr", { [operatorToTest]: 10 } as any);
        expect(result).toStrictEqual({ operator: operatorToTest, comparand: 10 });
      });
      test(`throws an InvalidExpressionError for an "${operatorToTest}" expression with an invalid value`, () => {
        [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
          expect(() =>
            getNormalizedComparisonMeta("attr", { [operatorToTest]: invalidValue } as any)
          ).toThrowError(InvalidExpressionError);
        });
      });
    }
  );

  // beginsWith
  test(`returns the operator and comparand for a "beginsWith" expression with a string value`, () => {
    const result = getNormalizedComparisonMeta("attr", { beginsWith: "value" });
    expect(result).toStrictEqual({ operator: "beginsWith", comparand: "value" });
  });
  test(`throws an InvalidExpressionError for a "beginsWith" expression with an invalid value`, () => {
    [undefined, null, [], {}, true, NaN, 10].forEach((invalidValue) => {
      expect(() =>
        getNormalizedComparisonMeta("attr", { beginsWith: invalidValue as any })
      ).toThrowError(InvalidExpressionError);
    });
  });

  // between
  test(`returns the operator and comparand for a "between" expression with strings`, () => {
    const result = getNormalizedComparisonMeta("attr", { between: ["a", "z"] });
    expect(result).toStrictEqual({ operator: "between", comparand: ["a", "z"] });
  });
  test(`returns the operator and comparand for a "between" expression with numbers`, () => {
    const result = getNormalizedComparisonMeta("attr", { between: [1, 9] });
    expect(result).toStrictEqual({ operator: "between", comparand: [1, 9] });
  });
  test(`throws an InvalidExpressionError for a "between" expression with invalid values`, () => {
    [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
      // For each invalid value, create various types of invalid comparands, and test them against 'between':
      [
        invalidValue,
        [invalidValue],
        [invalidValue, "value"],
        ["value", invalidValue],
        [invalidValue, NaN],
        [NaN, invalidValue],
      ].forEach((invalidComparand) => {
        expect(() =>
          getNormalizedComparisonMeta("attr", { between: invalidComparand as any })
        ).toThrowError(InvalidExpressionError);
      });
    });
  });
  test(`throws an InvalidExpressionError for a "between" expression with valid values that are not the same type`, () => {
    expect(() => getNormalizedComparisonMeta("attr", { between: ["a", 1] as any })).toThrowError(InvalidExpressionError); // prettier-ignore
    expect(() => getNormalizedComparisonMeta("attr", { between: [1, "a"] as any })).toThrowError(InvalidExpressionError); // prettier-ignore
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
        getNormalizedComparisonMeta("attr", { ...comparisonObject, eq: "value" } as any)
      ).toThrowError(/contains more than one operator/i);
    });
  });

  // destructive test case: invalid operator
  test(`throws an InvalidExpressionError when called with a key which is not a valid operator`, () => {
    ["BAD", "EQ", "begins_with", ""].forEach((nonOperatorValue) => {
      expect(() =>
        getNormalizedComparisonMeta("attr", { [nonOperatorValue]: "value" } as any)
      ).toThrowError(/invalid comparison operator/i);
    });
  });
});
