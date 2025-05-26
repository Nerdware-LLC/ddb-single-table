import { isDate, isString } from "@nerdware/ts-type-safety-utils";
import { hasDefinedProperty } from "../../utils/index.js";
import type { IOActions, IOAction, IODirection } from "./types.js";
import type { SchemaSupportedTypeStringLiteral } from "../../Schema/types/index.js";
import type { BaseItem } from "../../types/index.js";

/**
 * A mapping of supported JS types to IO-Action methods for converting to/from DynamoDB types.
 */
const DDB_TYPE_MAP: {
  readonly [TypeStringLiteral in SchemaSupportedTypeStringLiteral]?: {
    readonly [Key in IODirection]: (value: NonNullable<unknown>) => NonNullable<unknown>;
  };
} = {
  Date: {
    /** Converts a `Date` object or date string into an ISO-8601 formatted string. */
    toDB: (value) => {
      return isDate(value)
        ? value.toISOString()
        : isString(value) && !isNaN(Date.parse(value))
          ? new Date(value).toISOString()
          : value; // If not a valid date, return the original value
    },
    /** Converts a date string into a `Date` object. */
    fromDB: (value) => {
      return isString(value) && !isNaN(Date.parse(value)) ? new Date(value) : value;
    },
  },
};

/**
 * This `IOAction` converts JS types to DynamoDB types and vice versa (see {@link DDB_TYPE_MAP}).
 *
 * -------------------------------------------------------------------------------------------
 * ### `toDB` Conversions
 *
 * > | JS Type &ensp; | → DynamoDB Type               |
 * > | :------------- | :---------------------------- |
 * > | `Date`         | → [ISO-8601][iso-8601] string |
 *
 * ### `fromDB` Conversions
 *
 * > | DynamoDB Type &ensp;                       | → JS Type |
 * > | :----------------------------------------- | :-------- |
 * > | [Date-time-formatted string][date-str-fmt] | → `Date`  |
 *
 * [iso-8601]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
 * [date-str-fmt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
 */
export const convertJsTypes: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, ioDirection, ...ctx }
) {
  // To avoid mutating the original item, create a new object to return
  const itemToReturn: BaseItem = { ...item };

  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // If the itemToReturn does not have the attribute, or if its value is nullish, skip it
    if (!hasDefinedProperty(itemToReturn, attrName)) continue;

    const itemValue = itemToReturn[attrName];

    // Check if the attribute type is defined in DDB_TYPE_MAP
    const typeConverterFn = DDB_TYPE_MAP[attrConfig.type]?.[ioDirection];

    if (typeConverterFn) {
      itemToReturn[attrName] = typeConverterFn(itemValue);
    } else if ((attrConfig.type === "map" || attrConfig.type === "array") && attrConfig.schema) {
      // Run recursively on nested attributes
      (itemToReturn as BaseItem)[attrName] = this.recursivelyApplyIOAction(
        this.convertJsTypes,
        itemValue,
        {
          parentItem: itemToReturn,
          ioDirection,
          ...ctx,
          schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
        }
      );
    }
  }

  return itemToReturn;
};
