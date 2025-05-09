import dayjs, { type ConfigType as DayJsCtorParamType } from "dayjs";

/**
 * This type reflects values that can be converted to a valid DayJS timestamp.
 *
 * The `dayjs` constructor accepts {@link DayJsCtorParamType|multiple arg types};
 * this type excludes `null` and `undefined` from the union of permitted values
 * since they'll never result in a valid timestamp.
 */
export type ValidTimestamp = Exclude<DayJsCtorParamType, null | undefined>;

/**
 * `typeof` strings of value-types which should not be provided to the `dayjs` constructor.
 */
const INVALID_TIMESTAMP_VALUE_TYPES = new Set([
  "symbol", //  <-- causes `dayjs()` to throw
  "bigint", //  <-- causes `dayjs()` to throw
  "boolean", // <-- causes false positives in `dayjs.isValid`
]);

/**
 * This type-guard function tests if the provided `value` can be converted into a valid Date object.
 *
 * **`dayjs.isValid` Notes:**
 *
 * - The fn will only throw when given a `Symbol` or `BigInt`.
 * - The fn will return `false` for `null`, `""` (empty string), and invalid objects.
 * - The fn will return `true` for `undefined` and `0`, which for this project's purposes are not
 *   valid timestamps, so the conditional contains a truthy-check to weed out these false positives.
 *
 * @param value The value to test.
 * @returns `true` if the value can be converted into a valid Date object.
 */
export const isConvertibleToDate = (value?: unknown): value is ValidTimestamp => {
  // `value` is cast to any, bc the first two checks ensure it won't throw
  return (
    !!value
    && !INVALID_TIMESTAMP_VALUE_TYPES.has(typeof value)
    && dayjs(value as DayJsCtorParamType).isValid()
  );
};
