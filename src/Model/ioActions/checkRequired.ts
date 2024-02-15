import { hasDefinedProperty, ItemInputError, getAttrErrID } from "../../utils/index.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` checks an item for the existence of properties
 * marked `required` in the schema, and throws an error if a required property is
 * not present (as indicated by `hasOwnProperty`), or its value is `null` or
 * `undefined`. This check occurs by default for the following Model methods:
 *
 * - `createItem`
 * - `upsertItem`
 * - `batchUpsertItems`
 * - `batchUpsertAndDeleteItems` (only the `upsertItems` clause)
 */
export const checkRequired: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, modelName, ...ctx }
) {
  schemaEntries.forEach(([attrName, attrConfig]) => {
    // Check if item is missing a required field
    if (attrConfig?.required === true && !hasDefinedProperty(item, attrName)) {
      // Throw error if required field is missing
      throw new ItemInputError(
        `A value is required for ${getAttrErrID(modelName, attrName, attrConfig)}.`
      );
    }
    // Run recursively on nested attributes if parent exists
    if (attrConfig?.schema && hasDefinedProperty(item, attrName)) {
      this.recursivelyApplyIOAction(this.checkRequired, item[attrName], {
        parentItem: item,
        modelName,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  });
  return item;
};
