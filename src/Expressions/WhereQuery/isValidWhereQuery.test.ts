import { isValidWhereQueryOperator, validateWhereQueryComparand } from "./isValidWhereQuery";
import { InvalidExpressionError } from "../../utils";
import type { WhereQueryOperator } from "./types";

describe("isValidWhereQueryOperator()", () => {
  ["eq", "lt", "lte", "gt", "gte", "between", "beginsWith"].forEach((validOperator) => {
    test(`returns true for valid operator "${validOperator}"`, () => {
      expect(isValidWhereQueryOperator(validOperator)).toBe(true);
    });
  });
  test(`returns false when called with anything other than a valid operator`, () => {
    ["", "bad", "EQ", 10, NaN, null, undefined, true, false, {}, []].forEach((invalidValue) => {
      expect(isValidWhereQueryOperator(invalidValue as any)).toBe(false);
    });
  });
});

describe("validateWhereQueryComparand()", () => {
  // eq, lt, lte, gt, gte
  (["eq", "lt", "lte", "gt", "gte"] satisfies Array<WhereQueryOperator>).forEach(
    (validOperator) => {
      test(`returns true when called with "${validOperator}" and a string`, () => {
        expect(validateWhereQueryComparand(validOperator, "value")).toBe(true);
      });
      test(`returns true when called with "${validOperator}" and a number`, () => {
        expect(validateWhereQueryComparand(validOperator, 10)).toBe(true);
      });
      test(`throws an InvalidExpressionError when called with "${validOperator}" and an invalid value`, () => {
        [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
          expect(() =>
            validateWhereQueryComparand(validOperator, invalidValue)
          ).toThrowError(InvalidExpressionError); // prettier-ignore
        });
      });
    }
  );

  // beginsWith
  test(`returns true when called with "beginsWith" and a string`, () => {
    expect(validateWhereQueryComparand("beginsWith", "value")).toBe(true);
  });
  test(`throws an InvalidExpressionError when called with "beginsWith" and an invalid value`, () => {
    [undefined, null, [], {}, true, NaN, 10].forEach((invalidValue) => {
      expect(() =>
        validateWhereQueryComparand("beginsWith", invalidValue)
      ).toThrowError(InvalidExpressionError); // prettier-ignore
    });
  });

  // between
  test(`returns true when called with "between" and a string array`, () => {
    expect(validateWhereQueryComparand("between", ["a", "z"])).toBe(true);
  });
  test(`returns true when called with "between" and a number array`, () => {
    expect(validateWhereQueryComparand("between", [1, 9])).toBe(true);
  });
  test(`throws an InvalidExpressionError when called with "between" and an invalid value`, () => {
    // prettier-ignore
    [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
      expect(() => validateWhereQueryComparand("between", invalidValue)).toThrowError(InvalidExpressionError);
      expect(() => validateWhereQueryComparand("between", [invalidValue])).toThrowError(InvalidExpressionError);
      expect(() => validateWhereQueryComparand("between", [invalidValue, "value"])).toThrowError(InvalidExpressionError);
      expect(() => validateWhereQueryComparand("between", ["value", invalidValue])).toThrowError(InvalidExpressionError);
      expect(() => validateWhereQueryComparand("between", [invalidValue, NaN])).toThrowError(InvalidExpressionError);
      expect(() => validateWhereQueryComparand("between", [NaN, invalidValue])).toThrowError(InvalidExpressionError);
    });
  });
  test(`returns false when called with "between" and valid values that are not the same type`, () => {
    expect(() => validateWhereQueryComparand("between", ["a", 1])).toThrowError(InvalidExpressionError); // prettier-ignore
    expect(() => validateWhereQueryComparand("between", [1, "a"])).toThrowError(InvalidExpressionError); // prettier-ignore
  });

  // destructive test case: invalid operator
  test("throws an InvalidExpressionError when provided with an invalid operator", () => {
    expect(() => validateWhereQueryComparand("BAD" as any, "value")).toThrowError(InvalidExpressionError); // prettier-ignore
  });
});
