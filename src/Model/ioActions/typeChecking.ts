import { safeJsonStringify } from "@nerdware/ts-type-safety-utils";
import { ItemInputError, getAttrErrID, stringifyNestedSchema } from "../../utils/errors.js";
import { hasDefinedProperty, isType } from "../../utils/index.js";
import type { ModelSchemaNestedAttributes as NestedAttributes } from "../../Schema/types.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` checks item properties for conformance with their
 * respective attribute "type" as defined in the schema.
 */
export const typeChecking: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, modelName, ...ctx }
) {
  schemaEntries.forEach(([attrName, attrConfig]) => {
    /* If item has schemaKey and the value is truthy */
    if (hasDefinedProperty(item, attrName)) {
      // Check the type of its value (can't check unknown attributes if schema allows for them)
      if (!isType[attrConfig.type](item[attrName], attrConfig?.oneOf ?? attrConfig?.schema ?? [])) {
        // Throw error if there's a type mismatch
        throw new ItemInputError(
          `Invalid type of value provided for ${getAttrErrID(modelName, attrName, attrConfig)}.` +
            `\nExpected: ${attrConfig.type} ` +
            (attrConfig.type === "enum"
              ? `(oneOf: ${safeJsonStringify(attrConfig.oneOf)})`
              : ["map", "array", "tuple"].includes(attrConfig.type) // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
                ? `(schema: ${stringifyNestedSchema(attrConfig.schema as NestedAttributes)})` // <-- eslint rule false positive
                : "") +
            `\nReceived: ${safeJsonStringify(item[attrName])}`
        );
      }
      // Run recursively on nested attributes
      if (attrConfig?.schema) {
        this.recursivelyApplyIOAction(this.typeChecking, item[attrName], {
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
