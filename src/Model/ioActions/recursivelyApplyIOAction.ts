import { isType } from "../../utils/isType.js";
import type { ModelSchemaType, SchemaEntries } from "../../Schema/types.js";
import type { IOActions, IOActionRecursiveApplicator } from "./types.js";

/**
 * Applies the provided `ioAction` to nested attribute types.
 */
export const recursivelyApplyIOAction: IOActionRecursiveApplicator = function (
  this: IOActions,
  ioAction,
  attrValue,
  { schema: nestedSchema, ...ctx }
) {
  /* See if nested schema is an array or an object. Nested values can only be set if
  parent already exists, so attrValue is also checked (if !exists, do nothing). Note
  that `ioAction` must be called using the `call` prototype method to ensure the fn
  doesn't lose its "this" context. */
  if (isType.array(nestedSchema) && isType.array(attrValue)) {
    /* For both ARRAYs and TUPLEs, since `IOAction`s require `item` to
    be an object, array values and their respective nested schema are provided as
    the value to a wrapper object with an arbitrary key of "_".  */

    // Determine TUPLE or ARRAY
    // prettier-ignore
    if (nestedSchema.length > 1 && nestedSchema.length === attrValue.length) {
      // TUPLE
      attrValue = attrValue.map((tupleEl, index) =>
        ioAction.call(this, { _: tupleEl }, {
          schema: { _: nestedSchema[index] } as ModelSchemaType,
          schemaEntries: [["_", nestedSchema[index]]] as SchemaEntries,
          ...ctx,
        })._
      );
    } else {
      // ARRAY
      attrValue = attrValue.map((arrayEl) =>
        ioAction.call(this, { _: arrayEl }, {
          schema: { _: nestedSchema[0] } as ModelSchemaType,
          schemaEntries: [["_", nestedSchema[0]]] as SchemaEntries,
          ...ctx,
        })._
      );
    }
  } else if (isType.map(nestedSchema) && isType.map(attrValue)) {
    // MAP
    attrValue = ioAction.call(this, attrValue, {
      schema: nestedSchema,
      schemaEntries: Object.entries(nestedSchema),
      ...ctx,
    });
  }
  // Return attrValue with schema-defined updates, if any.
  return attrValue;
};
