import type { AttributeName } from "./AttributeName.js";
import type { ModelSchemaAttributeConfig } from "./ModelSchemaAttributeConfig.js";

/**
 * This type reflects `Object.entries(modelSchema)`.
 *
 * This type is used by the `Model` class to achieve the following:
 *
 * - Ensure `IOAction`s aren't needlessly re-creating schema entries
 *   using `Object.entries(schema)` on every call.
 * - Ensure that the order of attributes processed by `IOAction`s is
 *   always consistent.
 * - Ensure that key attributes are always processed before non-key attributes.
 */
export type ModelSchemaEntries = Array<[AttributeName, ModelSchemaAttributeConfig]>;
