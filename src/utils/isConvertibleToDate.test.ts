import dayjs from "dayjs";
import { isConvertibleToDate } from "./isConvertibleToDate.js";

describe("isConvertibleToDate", () => {
  // Positive test cases:
  test("returns true when called with a Date object", () => {
    expect(isConvertibleToDate(new Date())).toBe(true);
  });
  test("returns true when called with a valid ISO date string", () => {
    expect(isConvertibleToDate(new Date().toISOString())).toBe(true);
  });
  test("returns true when called with a valid unix timestamp", () => {
    expect(isConvertibleToDate(new Date().getTime() / 1000)).toBe(true);
  });
  test("returns true when called with a number of milliseconds", () => {
    expect(isConvertibleToDate(new Date().getTime())).toBe(true);
  });
  test("returns true when called with a DayJS datetime object", () => {
    expect(isConvertibleToDate(dayjs())).toBe(true);
  });

  // Negative test cases:
  test("returns false when called with a string that does not represent a date/time", () => {
    expect(isConvertibleToDate("NOPE")).toBe(false);
  });
  test("returns false when called with null", () => {
    expect(isConvertibleToDate(null)).toBe(false);
  });
  test("returns false when called with an object that is not a Date", () => {
    expect(isConvertibleToDate({})).toBe(false);
  });
  test("returns false when called with undefined", () => {
    expect(isConvertibleToDate(undefined)).toBe(false);
  });
  test("returns false when called with a Symbol", () => {
    expect(isConvertibleToDate(Symbol("NOPE"))).toBe(false);
  });
  test("returns false when called with a BigInt", () => {
    expect(isConvertibleToDate(BigInt(1))).toBe(false);
  });
});
