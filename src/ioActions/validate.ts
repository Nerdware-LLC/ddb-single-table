import { hasDefinedProperty, ItemInputError, getAttrErrID } from "../utils";
import type { IOActions, IOActionMethod } from "./types";

/**
 * This `IOActionMethod` validates an item's individual properties using
 * attribute's respective `"validate"` functions provided in the schema.
 */
export const validate: IOActionMethod = function (
  this: IOActions,
  item,
  { schemaEntries, modelName, ...ctx }
) {
  schemaEntries.forEach(([attrName, attrConfig]) => {
    /* Check if item has schemaKey and value is neither null/undefined
    (can't validate unknown attributes if schema allows for them).  */
    if (hasDefinedProperty(item, attrName)) {
      // Run "validate" fn if defined in the schema
      if (!!attrConfig?.validate && !attrConfig.validate(item[attrName])) {
        // Throw error if validation fails
        throw new ItemInputError(
          `Invalid value for ${getAttrErrID(modelName, attrName, attrConfig)}.`
        );
      }
      // Run recursively on nested attributes
      if (attrConfig?.schema) {
        this.recursivelyApplyIOAction(this.validate, item[attrName], {
          parentItem: item,
          modelName,
          ...ctx,
          schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
        });
      }
    }
  });
  return item;
};
