import { hasDefinedProperty, ItemInputError, getAttrErrID } from "../../utils/index.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` checks an item for the existence of properties marked
 * `required` in the schema, and throws an error if a required property is
 * not present, or is `null`/`undefined`.
 */
export const checkRequired: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, modelName, ...ctx }
) {
  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

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
  }

  return item;
};
