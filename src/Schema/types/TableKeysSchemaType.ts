import type { AttributeName } from "./AttributeName.js";
import type { KeyAttributeConfig } from "./KeyAttributeConfig.js";

/**
 * Type for the `TableKeys` schema; for `Model` schemas, instead use {@link ModelSchemaType}.
 */
export interface TableKeysSchemaType {
  readonly [keyAttrName: AttributeName]: KeyAttributeConfig;
}
