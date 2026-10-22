import { getArrayWrapper, getSchemaPlan } from "../Schema/schemaPlan.js";
import { isType } from "../utils/isType.js";
import type { IOActionRecursiveApplicator } from "./types/index.js";

/**
 * Applies the provided `ioAction` to nested attribute types.
 */
export const recursivelyApplyIOAction: IOActionRecursiveApplicator = function (
  this,
  ioAction,
  attrValue,
  { schema: nestedSchema, ...ctx }
) {
  /* See if nested schema is an array or an object. Nested values can only be set if
    parent already exists, so attrValue is also checked (if !exists, do nothing). Note
    that `ioAction` must be called using the `call` prototype method to ensure the fn
    doesn't lose its "this" context. */
  if (isType.array(nestedSchema) && isType.array(attrValue)) {
    /* For both ARRAYs and TUPLEs, since `IOAction`s require `item` to be an object,
      array values and their respective nested schema are provided as the value to a
      wrapper object with an arbitrary key of "_".  */

    // Determine TUPLE or ARRAY
    // prettier-ignore
    if (nestedSchema.length > 1 && nestedSchema.length === attrValue.length) {
      // TUPLE
      attrValue = attrValue.map((tupleEl, index) =>
        ioAction.call(this, { [ARRAY_WRAPPER_KEY]: tupleEl }, {
          ...getArrayWrapper(nestedSchema[index]),
          ...ctx,
        })[ARRAY_WRAPPER_KEY] // <-- Extracts the value from the wrapper object returned by the ioAction.
      );
    } else {
      // ARRAY
      attrValue = attrValue.map((arrayEl) =>
        ioAction.call(this, { [ARRAY_WRAPPER_KEY]: arrayEl }, {
          ...getArrayWrapper(nestedSchema[0]),
          ...ctx,
        })[ARRAY_WRAPPER_KEY]
      );
    }
  } else if (isType.map(nestedSchema) && isType.map(attrValue)) {
    // MAP
    attrValue = ioAction.call(this, attrValue, {
      schema: nestedSchema,
      schemaEntries: getSchemaPlan(nestedSchema).entries,
      ...ctx,
    });
  }

  // Return attrValue with schema-defined updates, if any.
  return attrValue;
};

/** The key used to wrap array/tuple values in the `recursivelyApplyIOAction` function. */
const ARRAY_WRAPPER_KEY = "_";
