import { isUndefined } from "@nerdware/ts-type-safety-utils";
import { hasDefinedProperty, ItemInputError, getAttrErrID } from "../../utils/index.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` performs nullish-value `item` validation checks:
 *
 * @throws {ItemInputError} If an attr is `required`, and the value is missing/`undefined`.
 * @throws {ItemInputError} If an attr is _**NOT**_ `nullable`, and the value is `null`.
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
    if (
      attrConfig.required === true
      && (!Object.hasOwn(item, attrName) || isUndefined(item[attrName]))
    ) {
      // Throw error if required field is missing
      throw new ItemInputError(
        `A value is required for ${getAttrErrID(modelName, attrName, attrConfig)}.`
      );
    }

    // Check if item has a non-nullable field with a null value
    if (attrConfig.nullable !== true && Object.hasOwn(item, attrName) && item[attrName] === null) {
      // Throw error if non-nullable field is null
      throw new ItemInputError(
        `A non-null value is required for ${getAttrErrID(modelName, attrName, attrConfig)}.`
      );
    }

    // Run recursively on nested attributes if parent exists
    if (attrConfig.schema && hasDefinedProperty(item, attrName)) {
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
