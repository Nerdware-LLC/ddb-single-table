import { hasKey } from "@nerdware/ts-type-safety-utils";
import { ItemInputError } from "../../utils/index.js";
import type { IOActions, IOAction } from "./types.js";
import type { BaseItem } from "../../types/itemTypes.js";

/**
 * This `IOAction` swaps attribute-names with their corresponding aliases:
 * - `toDB`: replaces "alias" keys with attribute names
 * - `fromDB`: replaces attribute names with "alias" keys
 */
export const aliasMapping: IOAction = function (
  this: IOActions,
  item,
  { aliasesMap, modelName, schema, schemaOptions: { allowUnknownAttributes } }
) {
  const itemToReturn: BaseItem = {};

  // Iterate over the item's keys
  for (const itemKey in item) {
    if (hasKey(aliasesMap, itemKey)) {
      // If itemKey is in the aliasMap, update the item with the mapped key
      itemToReturn[aliasesMap[itemKey]] = item[itemKey];
    } else if (
      hasKey(schema, itemKey) ||
      allowUnknownAttributes === true ||
      (Array.isArray(allowUnknownAttributes) && allowUnknownAttributes.includes(itemKey))
    ) {
      // Else if itemKey is an attribute OR schema allows the unknown attribute, simply add K-V as-is
      itemToReturn[itemKey] = item[itemKey];
    } else {
      throw new ItemInputError(`${modelName} item contains unknown property: "${itemKey}"`);
    }
  }

  return itemToReturn;
};
