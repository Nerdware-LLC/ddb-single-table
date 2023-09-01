import dayjs, { type ConfigType } from "dayjs";

/**
 * This type-guard function tests if the provided `value` can be converted
 * into a valid Date object.
 *
 * @param value The value to test.
 * @returns `true` if the value can be converted into a valid Date object.
 */
export const isConvertibleToDate = (
  value: unknown
): value is Exclude<ConfigType, null | undefined> => {
  // The dayjs ctor only ever throws when given a Symbol or BigInt.
  return !["symbol", "bigint", "undefined"].includes(typeof value) && dayjs(value as any).isValid();
};
