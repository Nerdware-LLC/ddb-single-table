import { hasKey, isFunction } from "@nerdware/ts-type-safety-utils";
import { hasDefinedProperty } from "../../utils/hasDefinedProperty.js";
import type { IOActions, IOAction } from "./types.js";
import type { BaseItem } from "../../types/index.js";

/**
 * This `IOAction` applies any `"default"`s defined in the schema. Attribute
 * defaults are applied to an item when it either does not contain the attribute
 * as an own-property, or the attribute value is `null`/`undefined`.
 */
export const setDefaults: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, parentItem = item, ...ctx }
) {
  // To avoid mutating the original item, create a new object to return
  const itemToReturn: BaseItem = { ...item };

  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // If a default is defined, and itemToReturn[attrName] is null/undefined, use the default
    if (hasKey(attrConfig as any, "default") && !hasDefinedProperty(itemToReturn, attrName)) {
      const attrDefault = attrConfig.default;
      // Check if "default" is a function, and if so, call it to get the "default" value
      itemToReturn[attrName] = isFunction(attrDefault) ? attrDefault(parentItem) : attrDefault;
    }
    // Run recursively on nested attributes if parent value exists
    if (attrConfig.schema && hasKey(itemToReturn as any, attrName)) {
      itemToReturn[attrName] = this.recursivelyApplyIOAction(
        this.setDefaults,
        itemToReturn[attrName],
        {
          parentItem,
          ...ctx,
          schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
        }
      );
    }
  }

  return itemToReturn;
};
