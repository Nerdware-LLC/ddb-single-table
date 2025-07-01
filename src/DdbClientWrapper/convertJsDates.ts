import { isDate } from "@nerdware/ts-type-safety-utils";
import {
  isValidIso8601DatetimeString,
  getRecursiveValueConverter,
  type ValueConverterFn,
} from "../utils/index.js";
import type { IODirection } from "../IOActions/types/index.js";
import type {
  BaseItem,
  SupportedAttributeValueType,
  NativeAttributeValue,
} from "../types/index.js";

const DATE_CONVERSION_FNS = {
  /** Recursively converts JS `Date` objects and datetime-formatted strings into ISO-8601 strings. */
  toDB: getRecursiveValueConverter<string>((value) =>
    isDate(value)
      ? value.toISOString()
      : isValidIso8601DatetimeString(value)
        ? new Date(value).toISOString()
        : undefined
  ),
  /** Recursively converts datetime-formatted strings into JS `Date` objects. */
  fromDB: getRecursiveValueConverter<Date>((value) =>
    isValidIso8601DatetimeString(value) ? new Date(value) : undefined
  ),
} as const satisfies Record<IODirection, ValueConverterFn>;

/**
 * Converts all JS `Date` objects contained within `item` into ISO-8601 strings, and vice versa.
 */
export const convertJsDates = <T extends IODirection>(ioDirection: T, item: BaseItem) => {
  // Get the appropriate conversion function based on the I/O direction
  const typeConverterFn = DATE_CONVERSION_FNS[ioDirection];

  // To avoid mutating the original item, create a new object to return
  const itemToReturn: BaseItem = { ...item };

  // Iterate over the item's keys
  for (const itemKey of Object.keys(item)) {
    itemToReturn[itemKey] = typeConverterFn(item[itemKey]);
  }

  return itemToReturn as {
    [attrName: string]: T extends "toDB" ? NativeAttributeValue : SupportedAttributeValueType;
  };
};
