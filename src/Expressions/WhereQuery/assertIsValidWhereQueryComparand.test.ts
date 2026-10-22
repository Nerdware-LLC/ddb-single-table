import { InvalidExpressionError } from "../../utils/errors.js";
import { assertIsValidWhereQueryComparand } from "./assertIsValidWhereQueryComparand.js";
import type { WhereQueryOperator } from "./types/index.js";

describe("assertIsValidWhereQueryComparand()", () => {
  // eq, lt, lte, gt, gte
  (["eq", "lt", "lte", "gt", "gte"] satisfies Array<WhereQueryOperator>).forEach(
    (validOperator) => {
      test(`does not throw when called with "${validOperator}" and a string`, () => {
        expect(() => assertIsValidWhereQueryComparand(validOperator, "value")).not.toThrow();
      });
      test(`does not throw when called with "${validOperator}" and a number`, () => {
        expect(() => assertIsValidWhereQueryComparand(validOperator, 10)).not.toThrow();
      });
      test(`throws an InvalidExpressionError when called with "${validOperator}" and an invalid value`, () => {
        [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
          expect(
            () => assertIsValidWhereQueryComparand(validOperator, invalidValue) //
          ).toThrow(InvalidExpressionError);
        });
      });
    }
  );

  // beginsWith
  test(`does not throw when called with "beginsWith" and a string`, () => {
    expect(() => assertIsValidWhereQueryComparand("beginsWith", "value")).not.toThrow();
  });
  test(`throws an InvalidExpressionError when called with "beginsWith" and an invalid value`, () => {
    [undefined, null, [], {}, true, NaN, 10].forEach((invalidValue) => {
      expect(
        () => assertIsValidWhereQueryComparand("beginsWith", invalidValue) //
      ).toThrow(InvalidExpressionError);
    });
  });

  // between
  test(`does not throw when called with "between" and a string array`, () => {
    expect(() => assertIsValidWhereQueryComparand("between", ["a", "z"])).not.toThrow();
  });
  test(`does not throw when called with "between" and a number array`, () => {
    expect(() => assertIsValidWhereQueryComparand("between", [1, 9])).not.toThrow();
  });
  test(`throws an InvalidExpressionError when called with "between" and an invalid value`, () => {
    [undefined, null, [], {}, true, NaN].forEach((invalidValue) => {
      // For each invalid value, create invalid comparands of various shapes
      [
        invalidValue,
        [invalidValue],
        [invalidValue, "value"],
        ["value", invalidValue],
        [invalidValue, NaN],
        [NaN, invalidValue],
      ].forEach((invalidComparand) => {
        expect(
          () => assertIsValidWhereQueryComparand("between", invalidComparand) //
        ).toThrow(InvalidExpressionError);
      });
    });
  });
  test(`throws an InvalidExpressionError when called with "between" and valid values that are not the same type`, () => {
    expect(() => assertIsValidWhereQueryComparand("between", ["a", 1])).toThrow(InvalidExpressionError); // prettier-ignore
    expect(() => assertIsValidWhereQueryComparand("between", [1, "a"])).toThrow(InvalidExpressionError); // prettier-ignore
  });

  // destructive test case: invalid operator
  test("throws an InvalidExpressionError when provided with an invalid operator", () => {
    expect(() => assertIsValidWhereQueryComparand("BAD" as any, "value")).toThrow(InvalidExpressionError); // prettier-ignore
  });
});
