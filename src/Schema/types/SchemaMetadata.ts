import type { SetOptional, Simplify } from "type-fest";

/**
 * Base type for Schema metadata properties.
 */
export type SchemaMetadata = {
  schemaType: "ModelSchema" | "TableKeysSchema";
  name?: string;
  version?: string;
};

/**
 * ModelSchema {@link SchemaMetadata|metadata properties}.
 */
export type ModelSchemaMetadata = Simplify<
  SetOptional<SchemaMetadata, "schemaType"> & {
    schemaType?: "ModelSchema";
    name: string;
  }
>;

/**
 * TableKeysSchema {@link SchemaMetadata|metadata properties}.
 */
export type TableKeysSchemaMetadata = Simplify<
  SetOptional<SchemaMetadata, "schemaType"> & {
    schemaType?: "TableKeysSchema";
  }
>;
