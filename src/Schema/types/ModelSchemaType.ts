import type { AttributeName } from "./AttributeName.js";
import type { ModelSchemaAttributeConfig } from "./ModelSchemaAttributeConfig.js";
import type { TableKeysSchemaType } from "./TableKeysSchemaType.js";
import type { SetOptional } from "type-fest";

/**
 * Type for a `Model` schema; for the `TableKeys` schema, instead use {@link TableKeysSchemaType}.
 *
 * All `ModelSchemaType`s are given an index signature to allow for arbitrary attributes
 * to be defined, but the index signature is only used for non-key attributes; key
 * attributes must be explicitly defined and provided in the `TableKeysSchemaType` type
 * param.
 *
 * If the `TableKeysSchemaType` type-param is provided, any key attributes defined within
 * it are made _optional_ in the `ModelSchemaType`; the `"type"` and `"required"` attribute
 * configs are also made optional for key attributes (they're ultimately merged in from
 * the `TableKeysSchema`).
 */
export type ModelSchemaType<TableKeysSchema extends TableKeysSchemaType | undefined = undefined> =
  TableKeysSchema extends TableKeysSchemaType
    ? { readonly [attrName: AttributeName]: ModelSchemaAttributeConfig } & {
        readonly [KeyAttrName in keyof TableKeysSchema]?: SetOptional<
          ModelSchemaAttributeConfig,
          "type" | "required"
        >;
      }
    : { readonly [attrName: AttributeName]: ModelSchemaAttributeConfig };
