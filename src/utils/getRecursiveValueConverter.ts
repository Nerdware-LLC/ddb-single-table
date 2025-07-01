import { isArray, isPlainObject, isUndefined } from "@nerdware/ts-type-safety-utils";
import type { SupportedAttributeValueType, BaseItem } from "../types/index.js";

/**
 * A fn that converts a value from one type to another. If no conversion is applied,
 * it should return `undefined`. @see {@link getRecursiveValueConverter}
 */
export type ValueConverterFn<
  Result extends SupportedAttributeValueType = SupportedAttributeValueType,
> = (value: SupportedAttributeValueType) => Result;

/**
 * This function creates a recursive value converter that applies the provided `valueConverter`
 * to all non-falsy values in the input object or array.
 *
 * @template AllowedReturnTypes - Union of allowed return types for the `valueConverter` function.
 * @param valueConverter - A fn that returns a converted-value OR `undefined` if no conversion was applied.
 * @returns A function that recursively applies value-conversion to its `value` parameter.
 */
export const getRecursiveValueConverter = <AllowedReturnTypes extends SupportedAttributeValueType>(
  valueConverter: ValueConverterFn<AllowedReturnTypes | undefined>
) => {
  // This function will be called recursively to convert nested values
  const recursiveConversionFn: ValueConverterFn = (value) => {
    // First, return falsey values as-is
    if (!value) return value;

    // Run the value through the provided valueConverter
    const convertedValue = valueConverter(value);
    if (!isUndefined(convertedValue)) return convertedValue;

    // Check for types that necessitate recursive calls
    if (isArray(value)) return value.map(recursiveConversionFn);
    if (isPlainObject(value)) {
      const result: BaseItem = {};

      for (const itemKey of Object.keys(value)) {
        result[itemKey] = recursiveConversionFn(value[itemKey]);
      }

      return result;
    }
    // If none of the above apply, return the value as-is
    return value;
  };

  return recursiveConversionFn;
};
