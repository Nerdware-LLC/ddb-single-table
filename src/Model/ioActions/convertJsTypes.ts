import dayjs from "dayjs";
import { hasDefinedProperty, isConvertibleToDate, isType } from "../../utils";
import type { SupportedItemValueTypes } from "../../types/itemTypes";
import type { IOActions, IOActionMethod } from "./types";

/**
 * This `IOActionMethod` converts JS types to DynamoDB types and vice versa.
 *
 * - `"Date"` Attributes
 *   - `toDB`: JS Date objects are converted to unix timestamps
 *   - `fromDB`: Unix timestamps are converted to JS Date objects
 *
 * - `"Buffer"` Attributes
 *   - `toDB`: NodeJS Buffers are converted to binary strings
 *   - `fromDB`: Binary data is converted into NodeJS Buffers
 */
export const convertJsTypes: IOActionMethod = function (
  this: IOActions,
  item,
  { schemaEntries, ioDirection, ...ctx }
) {
  schemaEntries.forEach(([attrName, attrConfig]) => {
    if (hasDefinedProperty(item, attrName)) {
      const itemValue = item[attrName];
      const attrType = attrConfig.type;
      let convertedValue: SupportedItemValueTypes = undefined;

      if (attrType === "Date") {
        // For "Date" attributes, convert Date objects and ISO strings to unix timestamps and vice versa.
        if (ioDirection === "toDB" && (isType.Date(itemValue) || isType.string(itemValue))) {
          // toDB, convert Date objects to unix timestamps (Math.floor(new Date(value).getTime() / 1000))
          convertedValue = dayjs(itemValue).unix();
        } else if (ioDirection === "fromDB" && isConvertibleToDate(itemValue)) {
          // fromDB, convert timestamps to Date objects
          convertedValue = dayjs(
            isType.number(itemValue)
              ? itemValue * 1000 // <-- convert seconds to milliseconds
              : itemValue
          ).toDate();
        }
      } else if (attrType === "Buffer") {
        // For "Buffer" attributes, convert Buffers to binary and vice versa.
        if (ioDirection === "toDB" && isType.Buffer(itemValue)) {
          // toDB, convert Buffer objects to binary
          convertedValue = itemValue.toString("binary");
        } else if (ioDirection === "fromDB" && isType.string(itemValue)) {
          // fromDB, convert binary to Buffer objects
          convertedValue = Buffer.from(itemValue, "binary");
        }
      } else if ((attrType === "map" || attrType === "array") && attrConfig?.schema) {
        // Run recursively on nested attributes
        convertedValue = this.recursivelyApplyIOAction(this.convertJsTypes, itemValue, {
          parentItem: item,
          ioDirection,
          ...ctx,
          schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
        });
      }
      // Update the value if necessary
      if (convertedValue) item[attrName] = convertedValue;
    }
  });

  return item;
};
