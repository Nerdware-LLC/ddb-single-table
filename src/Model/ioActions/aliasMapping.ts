import { hasDefinedProperty, ItemInputError } from "../../utils/index.js";
import type { BaseItem } from "../../types/itemTypes.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` swaps attribute-names with their corresponding
 * aliases:
 * - `toDB`: replaces "alias" keys with attribute names
 * - `fromDB`: replaces attribute names with "alias" keys
 */
export const aliasMapping: IOAction = function (
  this: IOActions,
  item,
  { aliasesMap, schema, schemaOptions, modelName }
) {
  return Object.entries(item).reduce((accum: BaseItem, [itemKey, value]) => {
    if (hasDefinedProperty(aliasesMap, itemKey)) {
      // If itemKey is in the aliasMap, update the item with the mapped key
      accum[aliasesMap[itemKey]] = value;
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
