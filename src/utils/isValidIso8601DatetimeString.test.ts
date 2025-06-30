import { isValidIso8601DatetimeString } from "./isValidIso8601DatetimeString.js";

describe("isValidIso8601DatetimeString()", () => {
  /////////////////////////////////////////////////////////////////////////////
  // POSITIVE TEST CASES:

  test("returns true for valid ISO-8601 datetime strings", () => {
    [
      "2000-01-01T12:00:00Z",
      "2000-01-01T12:00:00.000Z",
      "1000-01-01T12:00:00Z", //   Earliest valid timestamp
      "9999-12-31T23:59:59.999Z", // Latest valid timestamp
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(true);
    });
  });

  test("returns true for valid ISO-8601 datetime strings with arbitrary millisecond precision", () => {
    [
      "2000-01-01T12:00:00.1Z",
      "2000-01-01T12:00:00.12Z",
      "2000-01-01T12:00:00.123456Z",
      "2000-01-01T12:00:00.123456789Z",
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(true);
    });
  });

  test("returns true for valid ISO-8601 datetime strings with timezone offsets", () => {
    [
      "2000-01-01T12:00:00+00:00",
      "2000-01-01T12:00:00-00:00",
      "2000-01-01T12:00:00+01:00",
      "2000-01-01T12:00:00-01:00",
      "2000-01-01T12:00:00+23:59",
      "2000-01-01T12:00:00-23:59",
      "2000-01-01T12:00:00.000+00:00",
      "2000-01-01T12:00:00.000+01:00",
      "2000-01-01T12:00:00.000+01:30",
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(true);
    });
  });

  test("returns true for valid ISO-8601 formatted date-only strings", () => {
    [
      "2000-01-01",
      "1000-01-01", // Earliest valid date
      "9999-12-31", // Latest valid date
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(true);
    });
  });

  /////////////////////////////////////////////////////////////////////////////
  // NEGATIVE TEST CASES:

  test("returns false and does not throw when called without arguments", () => {
    // @ts-expect-error Testing without arguments
    expect(isValidIso8601DatetimeString()).toBe(false);
  });

  test("returns false for empty strings", () => {
    expect(isValidIso8601DatetimeString("")).toBe(false);
  });

  test("returns false for strings that only contain whitespace", () => {
    expect(isValidIso8601DatetimeString(" ")).toBe(false);
  });

  test("returns false and does not throw when called with a non-string value", () => {
    [0, 1, {}, [], null, undefined, true, false].forEach((value) => {
      expect(isValidIso8601DatetimeString(value as any)).toBe(false);
    });
  });

  test("returns false for arbitrary non-datetime strings", () => {
    ["not a date", "Invalid Date", "-", "1", "123", "YYYY-MM-DD", "USER-1"].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for RFC-2822 datetime strings", () => {
    [
      "Sun, 31 Dec 2000 16:01:07 +0200",
      "Thu, 01 Jun 2000 12:34:56 GMT",
      "Thu, 01 Jun 2000 12:34:56 +0000",
      "Thu, 01 Jun 2000 12:34:56 +0530",
      "Thu, 01 Jun 2000 12:34:56 +0100",
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for incomplete date-only strings", () => {
    [
      "2000", //     Missing day and month
      "2000-", //    Missing day and month
      "2000-01", //  Missing day
      "2000-01-", // Missing day
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for date-only strings with an invalid YEAR component", () => {
    [
      "999-01-01", //   Year too early / must be 4 digits
      "0999-01-01", //  Year too early / no leading zeros allowed
      "10000-01-01", // Year too late  / must be 4 digits
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for date-only strings with an invalid MONTH component", () => {
    [
      "2000-00-01", // Month too low
      "2000-13-01", // Month too high
      "2000-1-01", //  Month missing leading zero
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for date-only strings with an invalid DAY component", () => {
    [
      "2000-01-00", // Day too low
      "2000-01-32", // Day too high
      "2000-01-1", //  Day missing leading zero
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for datetime strings with an incomplete TIME component", () => {
    [
      "2000-01-01T",
      "2000-01-01T12",
      "2000-01-01T12:",
      "2000-01-01T12:00",
      "2000-01-01T12:00:",
      "2000-01-01T12:00:00", // <-- Missing timezone
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });

  test("returns false for datetime strings with an invalid HOUR component", () => {
    expect(isValidIso8601DatetimeString("2000-01-01T25:00:00Z")).toBe(false);
  });

  test("returns false for datetime strings with an invalid MINUTE component", () => {
    expect(isValidIso8601DatetimeString("2000-01-01T12:60:00Z")).toBe(false);
  });

  test("returns false for datetime strings with an invalid SECONDS component", () => {
    expect(isValidIso8601DatetimeString("2000-01-01T12:00:60Z")).toBe(false);
  });

  test("returns false for datetime strings with an invalid MILLISECONDS component", () => {
    expect(isValidIso8601DatetimeString("2000-01-01T12:00:00.Z")).toBe(false); // "." present, but no digits
  });

  test("returns false for datetime strings with an invalid TIMEZONE OFFSET", () => {
    [
      "2000-01-01T12:00:00.000+00:00:00", // Invalid timezone format
      "2000-01-01T12:00:00.000+24:00", //    Invalid timezone hour   (+)
      "2000-01-01T12:00:00.000+00:60", //    Invalid timezone minute (+)
      "2000-01-01T12:00:00.000+00:00:60", // Invalid timezone second (+)
      "2000-01-01T12:00:00.000-24:00", //    Invalid timezone hour   (-)
      "2000-01-01T12:00:00.000-00:60", //    Invalid timezone minute (-)
      "2000-01-01T12:00:00.000-00:00:60", // Invalid timezone second (-)
    ].forEach((str) => {
      expect(isValidIso8601DatetimeString(str)).toBe(false);
    });
  });
});
