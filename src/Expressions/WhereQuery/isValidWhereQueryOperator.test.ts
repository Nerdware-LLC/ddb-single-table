import { isValidWhereQueryOperator } from "./isValidWhereQueryOperator.js";
import type { WhereQueryOperator } from "./types/index.js";
import type { UnionToTuple } from "type-fest";

describe("isValidWhereQueryOperator()", () => {
  test.each([
    "eq",
    "lt",
    "lte",
    "gt",
    "gte",
    "between",
    "beginsWith",
  ] satisfies UnionToTuple<WhereQueryOperator>)(
    `returns true for valid operator "%s"`,
    (validOperator) => {
      expect(isValidWhereQueryOperator(validOperator)).toBe(true);
    }
  );

  test(`returns false when called with anything other than a valid operator`, () => {
    ["", "bad", "EQ", 10, NaN, null, undefined, true, false, {}, []].forEach((invalidValue) => {
      expect(isValidWhereQueryOperator(invalidValue as any)).toBe(false);
    });
  });
});
