import { isString } from "@nerdware/ts-type-safety-utils";

/**
 * @returns `true` if the value is a valid datetime string, `false` otherwise.
 */
export const isValidDatetimeString = (value: unknown): value is string => {
  return isString(value) && !isNaN(Date.parse(value));
};
