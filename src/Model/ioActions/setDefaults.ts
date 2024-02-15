import { hasKey } from "@nerdware/ts-type-safety-utils";
import { hasDefinedProperty } from "../../utils/hasDefinedProperty.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` applies any `"default"`s defined in the schema in
 * the course of "create" operations. Attribute default values/functions are used
 * when the item either does not have the attribute (as determined by
 * `hasOwnProperty`), or the attribute value is `null` or `undefined`.
 *
 * > `UpdateItem` skips this action by default, since it is not a "create" operation.
 */
export const setDefaults: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, parentItem = item, ...ctx }
) {
  schemaEntries.forEach(([attrName, attrConfig]) => {
    // If a default is defined, and item[attrName] is null/undefined, use the default
    if (hasKey(attrConfig, "default") && !hasDefinedProperty(item, attrName)) {
      // hasKey/hasOwnProperty is used since default can be 0, false, etc.
      const attrDefault = attrConfig.default;
      // Check if "default" is a function, and if so, call it to get the "default" value
      item[attrName] = typeof attrDefault === "function" ? attrDefault(parentItem) : attrDefault;
    }
    // Run recursively on nested attributes if parent value exists
    if (attrConfig?.schema && hasKey(item, attrName)) {
      item[attrName] = this.recursivelyApplyIOAction(this.setDefaults, item[attrName], {
        parentItem,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  });
  return item;
};
