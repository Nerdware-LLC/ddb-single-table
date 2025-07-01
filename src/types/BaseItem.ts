import type { SupportedAttributeValueType } from "./SupportedAttributeValueType.js";

/**
 * A non-generic base Item-type with supported value types.
 */
export interface BaseItem {
  [attrName: string]: SupportedAttributeValueType;
}
