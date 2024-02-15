import { hasKey } from "@nerdware/ts-type-safety-utils";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` uses `transformValue` functions (if defined) to
 * transform attribute values before they are validated, converted to DynamoDB
 * types, etc.
 */
export const transformValues: IOAction = function (
  this: IOActions,
  item,
  { schemaEntries, ioDirection, ...ctx }
) {
  schemaEntries.forEach(([attrName, attrConfig]) => {
    // See if a transformValue fn is defined
    const transformValue = attrConfig?.transformValue?.[ioDirection];
    // If schema has transformValue toDB/fromDB, pass the existing value into the fn
    if (hasKey(item, attrName) && typeof transformValue === "function") {
      // Get new value; any type mismatches are caught later by the `typeChecking` method
      const transformedValue = transformValue(item[attrName]);
      // If transformedValue is not undefined, add it to item
      if (transformedValue !== undefined) item[attrName] = transformedValue;
    }
    // Run recursively on nested attributes if parent value exists
    if (attrConfig?.schema && hasKey(item, attrName)) {
      item[attrName] = this.recursivelyApplyIOAction(this.transformValues, item[attrName], {
        parentItem: item,
        ioDirection,
        ...ctx,
        schema: attrConfig.schema, // <-- overwrites ctx.schema with the nested schema
      });
    }
  });

  return item;
};
