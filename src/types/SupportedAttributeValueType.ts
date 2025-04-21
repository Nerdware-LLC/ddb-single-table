import type { BaseItem } from "./BaseItem.js";

/**
 * Union of attribute value types supported by this package.
 */
export type SupportedAttributeValueType =
  | string
  | number
  | boolean
  | Buffer
  | Date
  | BaseItem
  | Array<SupportedAttributeValueType>
  | null
  | undefined;
