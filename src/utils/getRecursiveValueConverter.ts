import { isArray, isPlainObject, isUndefined } from "@nerdware/ts-type-safety-utils";
import type { SupportedAttributeValueType, BaseItem } from "../types/index.js";

/**
 * A fn that converts a value from one type to another.
 * If no conversion is applied, it should return `undefined`.
 * @see {@link getRecursiveValueConverter}
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
    if (isArray(value)) {
      let result: SupportedAttributeValueType[] | undefined;
      for (let index = 0; index < value.length; index++) {
        const converted = recursiveConversionFn(value[index]);
        if (converted !== value[index]) {
          result ??= value.slice();
          result[index] = converted;
        }
      }
      return result ?? value;
    }

    if (isPlainObject(value)) {
      let result: BaseItem = value;
      for (const itemKey of Object.keys(value)) {
        const converted = recursiveConversionFn(value[itemKey]);
        if (converted !== value[itemKey]) {
          if (result === value) result = { ...value };
          Object.defineProperty(result, itemKey, {
            value: converted,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        }
      }
      return result;
    }

    // If none of the above apply, return the value as-is
    return value;
  };

  return recursiveConversionFn;
};
