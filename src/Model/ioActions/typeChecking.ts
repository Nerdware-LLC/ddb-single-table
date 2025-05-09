import { safeJsonStringify } from "@nerdware/ts-type-safety-utils";
import {
  hasDefinedProperty,
  isType,
  ItemInputError,
  getAttrErrID,
  stringifyNestedSchema,
} from "../../utils/index.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` ensures item values conform with their `"type"` as defined in the schema.
 *
 * @throws {ItemInputError} If an attribute's value does not match the expected `"type"`.
 */
export const typeChecking: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, modelName, ...ctx }
) {
  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // If the item does not have the attribute, or if its value is nullish, skip it
    if (!hasDefinedProperty(item, attrName)) continue;

    // Check the type of its value (can't check unknown attributes if schema allows for them)
    if (!isType[attrConfig.type](item[attrName], attrConfig.oneOf ?? attrConfig.schema ?? [])) {
      // Throw error if there's a type mismatch
      throw new ItemInputError(
        `Invalid type of value provided for ${getAttrErrID(modelName, attrName, attrConfig)}.`
          + `\nExpected: ${attrConfig.type} `
          + (attrConfig.type === "enum"
            ? `(oneOf: ${safeJsonStringify(attrConfig.oneOf)})`
            : ["map", "array", "tuple"].includes(attrConfig.type)
              ? `(schema: ${stringifyNestedSchema(attrConfig.schema!)})`
              : "")
          + `\nReceived: ${safeJsonStringify(item[attrName])}`
      );
    }

    // Run recursively on nested attributes
    if (attrConfig.schema) {
      this.recursivelyApplyIOAction(this.typeChecking, item[attrName], {
        parentItem: item,
        modelName,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  }

  return item;
};
