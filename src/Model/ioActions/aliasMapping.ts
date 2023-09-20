import { hasDefinedProperty, ItemInputError } from "../../utils";
import type { BaseItem } from "../../types/itemTypes";
import type { IOActions, IOActionMethod } from "./types";

/**
 * This `IOActionMethod` swaps attribute-names with their corresponding
 * aliases:
 * - `toDB`: replaces "alias" keys with attribute names
 * - `fromDB`: replaces attribute names with "alias" keys
 */
export const aliasMapping: IOActionMethod = function (
  this: IOActions,
  item,
  { schema, schemaOptions, ioDirection, modelName, ...ctx }
) {
  const aliasMap = ioDirection === "toDB" ? ctx.aliasesToAttributesMap : ctx.attributesToAliasesMap;

  return Object.entries(item).reduce((accum: BaseItem, [itemKey, value]) => {
    if (hasDefinedProperty(aliasMap, itemKey)) {
      // If itemKey is in the aliasMap, update the item with the mapped key
      accum[aliasMap[itemKey]] = value;
    } else if (
      hasDefinedProperty(schema, itemKey) ||
      schemaOptions.allowUnknownAttributes === true ||
      (Array.isArray(schemaOptions.allowUnknownAttributes) &&
        schemaOptions.allowUnknownAttributes.includes(itemKey))
    ) {
      // Else if itemKey is an attribute OR schema allows the unknown attribute, simply add K-V as-is
      accum[itemKey] = value;
    } else {
      throw new ItemInputError(`${modelName} item contains unknown property: "${itemKey}"`);
    }
    return accum;
  }, {});
};
