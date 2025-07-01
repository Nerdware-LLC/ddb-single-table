import { isFunction, isUndefined } from "@nerdware/ts-type-safety-utils";
import type { IOAction } from "./types/index.js";
import type { BaseItem } from "../types/index.js";

/**
 * This `IOAction` uses `transformValue` functions (if defined) to transform
 * attribute values before they are validated, converted to DynamoDB types, etc.
 */
export const transformValues: IOAction = function (
  this,
  item,
  { schemaEntries, ioDirection, ...ctx }
) {
  // To avoid mutating the original item, create a new object to return
  const itemToReturn: BaseItem = { ...item };

  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // See if a transformValue fn is defined
    const transformValue = attrConfig.transformValue?.[ioDirection];
    // If schema has transformValue toDB/fromDB, pass the existing value into the fn
    if (Object.hasOwn(itemToReturn, attrName) && isFunction(transformValue)) {
      // Get new value; any type mismatches are caught later by the `typeChecking` method
      const transformedValue = transformValue(itemToReturn[attrName]);
      // If transformedValue is not undefined, add it to itemToReturn
      if (!isUndefined(transformedValue)) itemToReturn[attrName] = transformedValue;
    }

    // Run recursively on nested attributes if parent value exists
    if (attrConfig.schema && Object.hasOwn(itemToReturn, attrName)) {
      itemToReturn[attrName] = this.recursivelyApplyIOAction(
        this.transformValues,
        itemToReturn[attrName],
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
