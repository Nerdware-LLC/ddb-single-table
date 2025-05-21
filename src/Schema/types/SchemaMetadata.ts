import type { ValueOf, OverrideProperties } from "type-fest";

/**
 * Dictionary of supported `Schema` types.
 */
export const SCHEMA_TYPE = {
  MODEL_SCHEMA: "ModelSchema",
  TABLE_KEYS_SCHEMA: "TableKeysSchema",
} as const satisfies Record<string, string>;

/**
 * Union of supported `schemaType` values.
 */
export type SchemaType = ValueOf<typeof SCHEMA_TYPE>;

/**
 * Base type for `Schema` metadata properties.
 */
export type SchemaMetadata = {
  schemaType: SchemaType;
  name?: string;
  version?: string;
};

/**
 * `ModelSchema` {@link SchemaMetadata|metadata properties}.
 */
export type ModelSchemaMetadata = OverrideProperties<
  SchemaMetadata,
  {
    name: string;
    schemaType?: "ModelSchema";
  }
>;

/**
 * `TableKeysSchema` {@link SchemaMetadata|metadata properties}.
 */
export type TableKeysSchemaMetadata = OverrideProperties<
  SchemaMetadata,
  {
    schemaType?: "TableKeysSchema";
  }
>;
