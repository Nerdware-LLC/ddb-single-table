import { hasKey } from "@nerdware/ts-type-safety-utils";

/**
 * A type-guard which returns a boolean indicating whether the following are all true:
 *
 * 1. `obj` is a truthy object
 * 2. `obj` has the provided `key` as an own-property
 * 3. `obj[key]` is neither `null` nor `undefined`
 */
export const hasDefinedProperty = <Obj extends Record<PropertyKey, any>, Key extends PropertyKey>(
  obj: Obj,
  key: Key
): obj is Obj & Record<Key, NonNullable<unknown>> => {
  return hasKey(obj, key) && obj[key] !== null && obj[key] !== undefined;
};
