import type { KeyAttributeConfig } from "./KeyAttributeConfig.js";
import type { ModelSchemaAttributeConfig } from "./ModelSchemaAttributeConfig.js";
import type { AllUnionFields } from "type-fest";

/**
 * This type reflects all possible attribute configs.
 *
 * > This type is used for attribute configs when the parent schema type is
 * > unknown, as is the case in many methods of the `BaseSchema` class.
 */
export type AnyValidAttributeConfig = AllUnionFields<
  KeyAttributeConfig | ModelSchemaAttributeConfig
>;
