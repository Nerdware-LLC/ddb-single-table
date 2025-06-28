import { isValidDatetimeString } from "./isValidDatetimeString.js";

describe("isValidDatetimeString", () => {
  test("returns true for valid ISO datetime strings", () => {
    [
      "2023-06-01",
      "2023-06-01T12:34:56Z",
      "2023-06-01T12:34:56.789Z",
      "2023-06-01T12:34:56+00:00",
      "2023-06-01T12:34:56+02:00",
      "2023-06-01T12:34:56.789+02:00",
      "2023-06-01T12:34:56.789+00:00",
      "2023-06-01T12:34:56.789+05:30",
    ].forEach((str) => {
      expect(isValidDatetimeString(str)).toBe(true);
    });
  });

  test("returns true for valid RFC2822 datetime strings", () => {
    [
      "Thu, 21 Dec 2000 16:01:07 +0200",
      "Wed, 01 Jun 2023 12:34:56 GMT",
      "Mon, 01 Jun 2023 12:34:56 +0000",
      "Fri, 01 Jun 2023 12:34:56 +0530",
      "Sat, 01 Jun 2023 12:34:56 +0100",
    ].forEach((str) => {
      expect(isValidDatetimeString(str)).toBe(true);
    });
  });

  test("returns false for invalid datetime strings", () => {
    [
      "not a date",
      "2023-13-01", // Invalid month
      "2023-06-32", // Invalid day
      "2023-06-01T25:00:00Z", // Invalid hour
      "2023-06-01T12:60:00Z", // Invalid minute
      "2023-06-01T12:34:60Z", // Invalid second
      "2023-06-01T12:34:56.789+25:00", // Invalid timezone hour
      "2023-06-01T12:34:56.789+00:60", // Invalid timezone minute
      "2023-06-01T12:34:56.789+00:00:60", // Invalid timezone second
      "2023-06-01T12:34:56.789+00:00:00", // Invalid timezone format
    ].forEach((str) => {
      expect(isValidDatetimeString(str)).toBe(false);
    });
  });

  test("returns false and does not throw when called with a non-string value", () => {
    [0, 1, {}, [], null, undefined, true, false].forEach((value) => {
      expect(isValidDatetimeString(value as any)).toBe(false);
    });
  });
});
