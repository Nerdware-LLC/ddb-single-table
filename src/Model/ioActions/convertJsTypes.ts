import { isDate, isString, isSafeInteger, isBuffer } from "@nerdware/ts-type-safety-utils";
import dayjs from "dayjs";
import { hasDefinedProperty, isConvertibleToDate } from "../../utils/index.js";
import type { IOActions, IOAction, IODirection } from "./types.js";
import type { SchemaSupportedTypeStringLiteral } from "../../Schema/types/index.js";
import type { BaseItem } from "../../types/index.js";

const DDB_TYPE_MAP: Partial<
  Record<
    SchemaSupportedTypeStringLiteral,
    Record<IODirection, (value: NonNullable<unknown>) => NonNullable<unknown>>
  >
> = {
  Buffer: {
    toDB: (value) => (isBuffer(value) ? value.toString("binary") : value),
    fromDB: (value) => (isString(value) ? Buffer.from(value, "binary") : value),
  },
  Date: {
    toDB: (value) =>
      isDate(value) || isString(value)
        ? dayjs(value).unix() // convert Dates/strings to unix timestamps
        : value,
    fromDB: (value) =>
      isConvertibleToDate(value) // convert valid timestamps to Date objects
        ? dayjs(
            isSafeInteger(value)
              ? value * 1000 // convert seconds to milliseconds
              : value
          ).toDate()
        : value,
  },
};

/**
 * This `IOAction` converts JS types to DynamoDB types and vice versa.
 *
 * - `"Date"` Attributes
 *   - `toDB`: JS Date objects are converted to unix timestamps
 *   - `fromDB`: Unix timestamps are converted to JS Date objects
 *
 * - `"Buffer"` Attributes
 *   - `toDB`: NodeJS Buffers are converted to binary strings
 *   - `fromDB`: Binary data is converted into NodeJS Buffers
 */
export const convertJsTypes: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, ioDirection, ...ctx }
) {
  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // If the item does not have the attribute, or if its value is nullish, skip it
    if (!hasDefinedProperty(item, attrName)) continue;

    const itemValue = item[attrName];

    // If the attribute type is "Date" or "Buffer", use the DDB_TYPE_MAP
    const typeConverterFn = DDB_TYPE_MAP[attrConfig.type]?.[ioDirection];

    if (typeConverterFn) {
      item[attrName] = typeConverterFn(itemValue);
    } else if ((attrConfig.type === "map" || attrConfig.type === "array") && attrConfig.schema) {
      // Run recursively on nested attributes
      (item as BaseItem)[attrName] = this.recursivelyApplyIOAction(this.convertJsTypes, itemValue, {
        parentItem: item,
        ioDirection,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  }

  return item;
};
