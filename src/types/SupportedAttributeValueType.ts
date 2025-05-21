import type { BaseItem } from "./BaseItem.js";
import type { NativeAttributeValue } from "./NativeAttributeValue.js";

/**
 * Union of attribute value types supported by this package.
 */
export type SupportedAttributeValueType =
  | NativeAttributeValue
  | Date
  | BaseItem
  | Array<SupportedAttributeValueType>;
