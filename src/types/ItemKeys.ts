import type { NativeKeyAttributeValue } from "./NativeAttributeValue.js";

/**
 * A non-generic base type representing the key fields of an Item.
 */
export type ItemKeys = {
  [keyAttrName: string]: NativeKeyAttributeValue;
};
