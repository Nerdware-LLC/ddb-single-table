import type { SchemaSupportedTypeStringLiterals } from "../Schema";

/** `string` type guard function */
export const isString = (value?: unknown): value is string => typeof value === "string";

/**
 * `number` type guard function
 *
 * ### DynamoDB Numbers
 *
 * - Can be positive, negative, or zero.
 * - Can have up to 38 digits of precision (JS only supports up to 16 digits of precision).
 * - Has a positive range of 1E-130 to 9.9999999999999999999999999999999999999E+125
 * - Has a negative range of -9.9999999999999999999999999999999999999E+125 to -1E-130
 * - Leading and trailing zeroes are trimmed.
 */
export const isNumber = (value?: unknown): value is number => {
  // isFinite returns false for NaN, Infinity, -Infinity
  return typeof value === "number" && Number.isFinite(value);
};

/** `boolean` type guard function */
export const isBoolean = (value?: unknown): value is boolean => typeof value === "boolean";

/** `function` type guard function */
// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (value?: unknown): value is Function => typeof value === "function";

/** `BigInt` type guard function */
export const isBigInt = (value?: unknown): value is bigint => typeof value === "bigint";

/** `Buffer` type guard function */
export const isBuffer = (value?: unknown): value is Buffer => Buffer.isBuffer(value);

/** `Symbol` type guard function */
export const isSymbol = (value?: unknown): value is symbol => typeof value === "symbol";

/** `undefined` type guard function */
export const isUndefined = (value?: unknown): value is undefined => value === void 0; // <-- most performant way to check for undefined

/** `null` type guard function */
export const isNull = (value?: unknown): value is null => value === null;

/** `Array` type guard function */
export const isArray: <T>(value?: unknown) => value is Array<T> | ReadonlyArray<T> = Array.isArray;

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
export const isPlainObject = <KeyTypes extends PropertyKey = string>(
  value?: unknown
): value is Record<KeyTypes, unknown> => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

/**
 * `Error` object type guard function which tests if `arg` is _either_ an instance of the `Error`
 * class _or_ if the return value of `Object.prototype.toString.call(arg)` is `"[object Error]"`.
 */
export const isErrorObject = (arg?: unknown): arg is Error => {
  return arg instanceof Error || Object.prototype.toString.call(arg) === "[object Error]";
};

/**
 * Type guard function for `type: "tuple"`
 *
 * > **Note:** This function does not check the types of values _within_ the provided tuple - that
 *   is accomplished by the `typeChecking` IO-Action which is applied recursively to nested values
 *   via `recursivelyApplyIOAction`.
 */
export const isTuple = (value?: unknown, nestedSchema?: unknown): value is [...unknown[]] => {
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
  /** Type guard function for `type: "number"` */
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
  map: isPlainObject,
  /** Type guard function for `type: "tuple"` */
  tuple: isTuple,
  /** Type guard function for `type: "enum"` */
  enum: isEnumMember,
} as const) satisfies Record<
  SchemaSupportedTypeStringLiterals,
  (value?: unknown, ...args: unknown[]) => boolean
>;
