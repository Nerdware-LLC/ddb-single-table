import { isString } from "@nerdware/ts-type-safety-utils";

/**
 * Regular expression for matching ISO-8601 formatted date or datetime strings.
 *
 * This pattern matches the following formats:
 * - Date-only strings: `YYYY-MM-DD`
 * - Date-time strings: `YYYY-MM-DDTHH:mm:ss[.fraction](Z|±HH:mm)`
 *
 * ✅ This pattern explicitly checks:
 * - Year is a 4-digit number, must not start with '0' (i.e., `1000` to `9999`)
 * - Month is `01` to `12`
 * - Day is `01` to `31`
 * - If present, time portion:
 *   - Hours: `00` to `23`
 *   - Minutes: `00` to `59`
 *   - Seconds: `00` to `59`
 *   - Optional fractional seconds (any number of decimal digits)
 * - If time is present, timezone is required:
 *   - Either 'Z' (UTC) or a numeric offset in `±HH:mm` format
 *   - Offset hours: `00` to `23`
 *   - Offset minutes: `00` to `59`
 *
 * ⚠️ This pattern does **NOT** check:
 * - Whether the day value is valid for the given month (e.g., `"2024-02-31"` will match, even though Feb never has 31 days)
 * - Whether the date is a valid calendar date (e.g., does not account for leap years)
 * - Whether the fractional seconds, if present, meet a specific precision requirement
 * - Any alternative date or time formats outside strict ISO-8601 with the described structure
 *
 * This regex is intended for fast, format-level validation to distinguish likely datetime strings
 * from unrelated strings (e.g., IDs, email addresses, arbitrary text) during data transformations.
 * Full calendar correctness should be enforced with additional parsing logic if required.
 */
const ISO_8601_DATETIME_OR_DATE_VALIDATION_REGEX =
  /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d))?$/;

/**
 * @returns `true` if the value is a valid ISO-8601 date or datetime string, `false` otherwise.
 *
 * @see {@link ISO_8601_DATETIME_OR_DATE_VALIDATION_REGEX} for validation details.
 */
export const isValidIso8601DatetimeString = (value: unknown): value is string => {
  return isString(value) && ISO_8601_DATETIME_OR_DATE_VALIDATION_REGEX.test(value);
};
