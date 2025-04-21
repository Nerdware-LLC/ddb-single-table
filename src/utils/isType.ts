import {
  isString,
  isBoolean,
  isBuffer,
  isDate,
  isArray,
  isPlainObject,
} from "@nerdware/ts-type-safety-utils";
import type { SchemaSupportedTypeStringLiteral } from "../Schema/types/index.js";

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

/**
 * Type guard function for `type: "tuple"`
 *
 * > **Note:** This function does not check the types of values _within_ the provided tuple — that
 *   is accomplished by the `typeChecking` IO-Action which is applied recursively to nested values
 *   via `recursivelyApplyIOAction`.
 */
export const isTuple = (value?: unknown, nestedSchema?: unknown): value is [...unknown[]] => {
  return isArray(value) && isArray(nestedSchema) && value.length === nestedSchema.length;
};

/** Type guard function for `type: "enum"` */
export const isEnumMember = <EnumValues extends ReadonlyArray<string>>(
  value?: unknown,
  allowedValues?: unknown
): value is EnumValues[number] => {
  return isString(value) && isArray(allowedValues) && allowedValues.includes(value);
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
  SchemaSupportedTypeStringLiteral,
  (value?: unknown, ...args: unknown[]) => boolean
>;
