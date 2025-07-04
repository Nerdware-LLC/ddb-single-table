import { hasDefinedProperty, ItemInputError, getAttrErrID } from "../utils/index.js";
import type { IOAction } from "./types/index.js";

/**
 * This `IOAction` validates an item's individual properties using
 * attribute's respective `"validate"` functions defined in the schema.
 *
 * @throws {ItemInputError} If any attribute's `"validate"` function returns `false`.
 */
export const validate: IOAction = function (this, item, { schemaEntries, modelName, ...ctx }) {
  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // If the item does not have the attribute, or if its value is nullish, skip it
    if (!hasDefinedProperty(item, attrName)) continue;

    // Run "validate" fn if defined in the schema
    if (!!attrConfig.validate && !attrConfig.validate(item[attrName])) {
      // Throw error if validation fails
      throw new ItemInputError(
        `Invalid value for ${getAttrErrID(modelName, attrName, attrConfig)}.`
      );
    }

    // Run recursively on nested attributes
    if (attrConfig.schema) {
      this.recursivelyApplyIOAction(this.validate, item[attrName], {
        parentItem: item,
        modelName,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  }

  return item;
};
