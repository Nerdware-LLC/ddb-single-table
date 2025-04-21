import type { BaseAttributeConfig } from "./BaseAttributeConfig.js";

/**
 * Non-key attribute configs.
 */
export interface ModelSchemaAttributeConfig extends BaseAttributeConfig {
  /**
   * An attribute's nested schema. This property is only valid for attributes of type
   * `"map"`, `"array"`, or `"tuple"`.
   *
   * For `"map"` attributes, the schema must be an object whose keys are the names of
   * the nested attributes, and whose values are the nested attribute configs. Note that
   * if a descendant attribute config defines a `default` value, that default will only
   * be applied if the parent already exists in the item being processed. For example,
   * to ensure that `myMap.myNestedMap.myNestedString` defaults to `"foo"` even if
   * `myNestedMap` is `null`/`undefined`, the `myNestedMap` attribute config should also
   * define a `default` value of `{}` (en empty object); alternatively, parent defaults
   * can also set child defaults, so `myNestedMap` could itself set the nested `"foo"`
   * property (e.g., `{ myNestedString: "foo" }` instead of `{}`).
   *
   * For `"array"` attributes, the schema must be an array of nested attribute configs.
   * Array schema can define both arrays and tuples:
   * - If the schema is an array with a length of 1, the attribute is treated as an array
   *   of variable length which contains elements of the type defined by the lone nested
   *   attribute config.
   * - If the schema is an array with a length > 1, the attribute is treated as a tuple
   *   of fixed length, where each element in the array is of the type defined by the
   *   attribute config at the corresponding index. Tuple attribute values on items being
   *   written to the DB must have the same length as the corresponding schema.
   *
   * > - `schema` is limited to a max nest depth of 5 levels.
   */
  readonly schema?: ModelSchemaNestedAttributes;
}

/**
 * Union of {@link ModelSchemaNestedMap} and {@link ModelSchemaNestedArray}.
 */
export type ModelSchemaNestedAttributes = ModelSchemaNestedMap | ModelSchemaNestedArray;

/**
 * Type for "schema" defining nested array of attribute values.
 */
export type ModelSchemaNestedArray = ReadonlyArray<ModelSchemaAttributeConfig>;

/**
 * Type for "schema" defining nested map of attribute values.
 */
export interface ModelSchemaNestedMap {
  readonly [nestedAttrName: string]: ModelSchemaAttributeConfig;
}
