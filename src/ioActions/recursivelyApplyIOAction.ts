import { isType } from "../utils";
import type { ModelSchemaType, SchemaEntries } from "../types/schemaTypes";
import type { IOActions, RecursiveIOActionMethod } from "./types";

/**
 * Applies any given `ioAction` to nested attributes of type "map" or "array".
 */
export const recursivelyApplyIOAction: RecursiveIOActionMethod = function (
  this: IOActions,
  ioAction,
  itemValue,
  { schema: nestedSchema, ...ctx }
) {
  /* See if nested schema is an array or an object. Nested values can only be set if
  parent already exists, so itemValue is also checked (if !exists, do nothing). Note
  that `ioAction` must be called using the `call` prototype method to ensure the fn
  doesn't lose its "this" context. */
  if (isType.array(nestedSchema) && isType.array(itemValue)) {
    /* For both ARRAYs and TUPLEs, since `IOActionMethod`s require `item` to
    be an object, array values and their respective nested schema are provided as
    the value to a wrapper object with an arbitrary key of "_".  */

    // Determine TUPLE or ARRAY
    // prettier-ignore
    if (nestedSchema.length > 1 && nestedSchema.length === itemValue.length) {
      // TUPLE
      itemValue = itemValue.map((tupleEl, index) =>
        ioAction.call(this, { _: tupleEl }, {
          schema: { _: nestedSchema[index] } as ModelSchemaType,
          schemaEntries: [["_", nestedSchema[index]]] as SchemaEntries,
          ...ctx,
        })._
      );
    } else {
      // ARRAY
      itemValue = itemValue.map((arrayEl) =>
        ioAction.call(this, { _: arrayEl }, {
          schema: { _: nestedSchema[0] } as ModelSchemaType,
          schemaEntries: [["_", nestedSchema[0]]] as SchemaEntries,
          ...ctx,
        })._
      );
    }
  } else if (isType.map(nestedSchema) && isType.map(itemValue)) {
    // MAP
    itemValue = ioAction.call(this, itemValue, {
      schema: nestedSchema,
      schemaEntries: Object.entries(nestedSchema),
      ...ctx,
    });
  }
  // Return itemValue with schema-defined updates, if any.
  return itemValue;
};
