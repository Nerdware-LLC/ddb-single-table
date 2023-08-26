import type { SupportedTypes } from "../types";

/** `string` type guard function */
export const isString = (value: unknown): value is string => typeof value === "string";

/** `number` type guard function */
export const isNumber = (value: unknown): value is number => Number.isSafeInteger(value);

/** `boolean` type guard function */
export const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

/** `function` type guard function */
export const isFunction = (value: unknown): value is boolean => typeof value === "function";

/** `BigInt` type guard function */
export const isBigInt = (value: unknown): value is bigint => typeof value === "bigint";

/** `Buffer` type guard function */
export const isBuffer = (value: unknown): value is Buffer => Buffer.isBuffer(value);

/** `Symbol` type guard function */
export const isSymbol = (value: unknown): value is symbol => typeof value === "symbol";

/** `undefined` type guard function */
export const isUndefined = (value: unknown): value is undefined => typeof value === "undefined";

/** `null` type guard function */
export const isNull = (value: unknown): value is null => value === null;

/** `Array` type guard function */
export const isArray = (value: unknown): value is Array<unknown> => Array.isArray(value);

/** `Date` type guard function */
export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/** `Object` type guard fn which tests if `value` is a `Record<>` object (e.g. `{ foo: "bar" }`). */
export const isRecordObject = <KeyTypes extends PropertyKey = string>(
  value: unknown
): value is Record<KeyTypes, unknown> => {
  return typeof value === "object" && !Array.isArray(value) && value !== null;
};

/** Type guard function for `type: "tuple"` */
export const isTuple = (value: unknown, nestedSchema: unknown): value is [...unknown[]] => {
  return (
    Array.isArray(value) && Array.isArray(nestedSchema) && value.length === nestedSchema.length
  );
};

/** Type guard function for `type: "enum"` */
export const isEnumMember = <EnumValues extends ReadonlyArray<string>>(
  value: unknown,
  allowedValues: unknown
): value is EnumValues[number] => {
  return typeof value === "string" && Array.isArray(allowedValues) && allowedValues.includes(value);
};

/**
 * Type guard functions for each of the supported `type` values in the `TableKeysSchema` object.
 */
export const isType = Object.freeze({
  string: isString,
  number: isNumber,
  boolean: isBoolean,
  Buffer: isBuffer,
  Date: isDate,
  array: isArray,
  map: isRecordObject,
  tuple: isTuple,
  enum: isEnumMember,
}) satisfies Record<SupportedTypes, (value: unknown, nestedSchema?: unknown) => boolean>;
