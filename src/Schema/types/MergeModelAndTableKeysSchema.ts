import type { KeyAttributeConfig } from "./KeyAttributeConfig.js";
import type { ModelSchemaAttributeConfig } from "./ModelSchemaAttributeConfig.js";
import type { ModelSchemaType } from "./ModelSchemaType.js";
import type { TableKeysSchemaType } from "./TableKeysSchemaType.js";
import type { SetOptional } from "type-fest";

/**
 * Use this type to derive a _merged_ schema type from merging a
 * `TableKeysSchema` and a `ModelSchema`.
 */
export type MergeModelAndTableKeysSchema<
  TableKeysSchema extends TableKeysSchemaType,
  ModelSchema extends ModelSchemaType<TableKeysSchema>,
> = {
  [K in keyof TableKeysSchema | keyof ModelSchema]: K extends keyof TableKeysSchema
    ? TableKeysSchema[K] extends KeyAttributeConfig // <-- K is in TableKeysSchema
      ? K extends keyof ModelSchema
        ? ModelSchema[K] extends SetOptional<ModelSchemaAttributeConfig, "type" | "required">
          ? TableKeysSchema[K] & ModelSchema[K]
          : never
        : TableKeysSchema[K]
      : never
    : K extends keyof ModelSchema // <-- K is NOT in TableKeysSchema
      ? ModelSchema[K] extends ModelSchemaAttributeConfig
        ? ModelSchema[K]
        : never
      : never; // <-- K must be in either TableKeysSchema or ModelSchema
};
