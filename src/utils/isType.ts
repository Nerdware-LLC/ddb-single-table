import type { SupportedTypes } from "../types";

/** `string` type guard function */
export const isString = (value?: unknown): value is string => {
  return typeof value === "string";
};

/**
 * Type guard function for `type: "number"` which returns `true` for safe numeric integers.
 *
 * **This function will return `false` for the following "number" values:**
 * - `NaN`
 * - `Infinity` / `-Infinity`
 * - `0.1 + 0.2` (which is `0.30000000000000004`)
 * - `Number.MAX_SAFE_INTEGER + 1` (which is `9007199254740992`)
 * - `Number.MIN_SAFE_INTEGER - 1` (which is `-9007199254740992`)
 * - `Number.MAX_VALUE` (which is `1.7976931348623157e+308`)
 * - `Number.MIN_VALUE` (which is `5e-324`)
 * - `Number.EPSILON` (which is `2.220446049250313e-16`)
 * - `Number.POSITIVE_INFINITY` (which is `Infinity`)
 * - `Number.NEGATIVE_INFINITY` (which is `-Infinity`)
 * - `Number.NaN` (which is `NaN`)
 */
export const isNumber = (value?: unknown): value is number => {
  return Number.isSafeInteger(value);
};

/** `boolean` type guard function */
export const isBoolean = (value?: unknown): value is boolean => {
  return typeof value === "boolean";
};

/** `function` type guard function */
export const isFunction = (value?: unknown): value is boolean => {
  return typeof value === "function";
};

/** `BigInt` type guard function */
export const isBigInt = (value?: unknown): value is bigint => {
  return typeof value === "bigint";
};

/** `Buffer` type guard function */
export const isBuffer = (value?: unknown): value is Buffer => {
  return Buffer.isBuffer(value);
};

/** `Symbol` type guard function */
export const isSymbol = (value?: unknown): value is symbol => {
  return typeof value === "symbol";
};

/** `undefined` type guard function */
export const isUndefined = (value?: unknown): value is undefined => {
  return value === void 0; // <-- most performant way to check for undefined
};

/** `null` type guard function */
export const isNull = (value?: unknown): value is null => {
  return value === null;
};

/** `Array` type guard function */
export const isArray = (value?: unknown): value is Array<unknown> => {
  return Array.isArray(value);
};

/** `Date` type guard function will return `false` if the Date is invalid. */
export const isDate = (value?: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Type guard function for `type: "map"` which tests if `value` is a `Record<>`-like object.
 *
 * Example values which will return `true`:
 *  - `{}`
 *  - `{ foo: "bar" }`
 *  - `Object.create(null)` // <-- Why checking the 'constructor' property won't work.
 */
export const isRecordObject = <KeyTypes extends PropertyKey = string>(
  value?: unknown
): value is Record<KeyTypes, unknown> => {
  return typeof value === "object" && Object.prototype.toString.call(value) === "[object Object]";
};

/** Type guard function for `type: "tuple"` */
export const isTuple = (value?: unknown, nestedSchema?: unknown): value is [...unknown[]] => {
  // TODO Add type-checking for values within the tuple
  return (
    Array.isArray(value) && Array.isArray(nestedSchema) && value.length === nestedSchema.length
  );
};

/** Type guard function for `type: "enum"` */
export const isEnumMember = <EnumValues extends ReadonlyArray<string>>(
  value?: unknown,
  allowedValues?: unknown
): value is EnumValues[number] => {
  return typeof value === "string" && Array.isArray(allowedValues) && allowedValues.includes(value);
};

/**
 * Type guard/safety functions for each of the supported schema attribute `type` values.
 */
export const isType = Object.freeze({
  /** Type guard function for `type: "string"` */
  string: isString,
  /**
   * Type guard function for `type: "number"` which returns `true` for safe numeric integers.
   * @see {@link isNumber} for more information.
   */
  number: isNumber,
  /** Type guard function for `type: "boolean"` */
  boolean: isBoolean,
  /** Type guard function for `type: "Buffer"` */
  Buffer: isBuffer,
  /** Type guard function for `type: "Date"` */
  Date: isDate,
  /** Type guard function for `type: "array"` */
  array: isArray,
  /** Type guard function for `type: "map"` */
  map: isRecordObject,
  /** Type guard function for `type: "tuple"` */
  tuple: isTuple,
  /** Type guard function for `type: "enum"` */
  enum: isEnumMember,
}) satisfies Record<SupportedTypes, (value: unknown, nestedSchema?: unknown) => boolean>;
