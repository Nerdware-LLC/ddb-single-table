import { hasKey, isFunction } from "@nerdware/ts-type-safety-utils";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` uses `transformValue` functions (if defined) to transform
 * attribute values before they are validated, converted to DynamoDB types, etc.
 */
export const transformValues: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, ioDirection, ...ctx }
) {
  // Iterate over schemaEntries
  for (let i = 0; i < schemaEntries.length; i++) {
    const [attrName, attrConfig] = schemaEntries[i];

    // See if a transformValue fn is defined
    const transformValue = attrConfig?.transformValue?.[ioDirection];
    // If schema has transformValue toDB/fromDB, pass the existing value into the fn
    if (hasKey(item as any, attrName) && isFunction(transformValue)) {
      // Get new value; any type mismatches are caught later by the `typeChecking` method
      const transformedValue = transformValue(item[attrName]);
      // If transformedValue is not undefined, add it to item
      if (transformedValue !== undefined) item[attrName] = transformedValue;
    }

    // Run recursively on nested attributes if parent value exists
    if (attrConfig?.schema && hasKey(item as any, attrName)) {
      item[attrName] = this.recursivelyApplyIOAction(this.transformValues, item[attrName], {
        parentItem: item,
        ioDirection,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  }

  return item;
};
