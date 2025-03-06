import type { CombineUnionOfObjects } from "../types/helpers.js";
import type { BaseItem, SupportedAttributeValueTypes } from "../types/itemTypes.js";
import type { SetOptional, Simplify } from "type-fest";

///////////////////////////////////////////////////////////////////////////////
// ATTRIBUTE CONFIG PROPERTY TYPES:

/**
 * Union of {@link SupportedAttributeValueTypes | supported types } represented as string literals.
 */
export type SchemaSupportedTypeStringLiterals =
  | "string"
  | "number"
  | "boolean"
  | "Buffer"
  | "Date"
  | "map"
  | "array"
  | "tuple"
  | "enum";

/**
 * Union of supported types for {@link BaseAttributeConfig.default | schema `default` configs }.
 */
export type AttributeDefault =
  | SupportedAttributeValueTypes
  | ((item: any) => SupportedAttributeValueTypes);

/**
 * Base attribute configs common to all attribute types.
 */
export interface BaseAttributeConfig {
  /**
   * The attribute's name outside of the database (e.g., alias "id" for attribute "pk").
   * During write operations, if the object provided to the Model method contains a key
   * matching a schema-defined `alias` value, the key is replaced with the attribute's
   * name. For both read and write operations, when data is returned from the database,
   * this key-switch occurs in reverse - any object keys which match an attribute with a
   * defined `alias` will be replaced with their respective `alias`. Note that all `alias`
   * values must be unique - the Model's constructor will throw an error if the schema
   * contains any duplicate `alias` values.
   */
  readonly alias?: string;
  /**
   * The attribute's DynamoDB type. Usage notes:
   *
   * - For nested types "map" and "array":
   *   - The shape of the nested object/array can be defined using the attribute's
   *     `schema` property.
   *   - `alias` is not supported for properties which are not top-level attributes.
   *
   * - For type "enum":
   *   - The `oneOf` property must be defined.
   */
  readonly type: SchemaSupportedTypeStringLiterals;
  /** Specifies allowed values for attributes of `type: "enum"`. */
  readonly oneOf?: ReadonlyArray<string>;
  /**
   * Optional attribute default value to apply during write operations. If set to a function,
   * it is called with the entire raw item-object provided to the Model method, and the attribute
   * value is set to the function's returned value. With the exception of `updateItem` calls, an
   * attribute's value is set to this `default` if the initial value provided to the Model method
   * is `undefined` or `null`. Note that if a specified `default` is a primitive rather than a fn,
   * and the primitive's type does not match the attribute's `type`, the Model's constructor will
   * throw an error. _This package does not validate functional `default`s._
   *
   * Bear in mind that key and index attributes are always processed _before_ all other attributes,
   * thereby making them available to use in `default` functions for other attributes. For example,
   * in the below `LibraryModelSchema`, each `authorID` is generated using the `libraryID` plus a
   * UUID:
   * ```ts
   * const LibraryModelSchema = {
   *   libraryID: {
   *     isHashKey: true,
   *     type: "string",
   *     default: () => makeLibraryID()
   *   },
   *   authors: {
   *     type: "array",
   *     schema: [
   *       {
   *         type: "map",
   *         schema: {
   *           authorID: {
   *             type: "string",
   *             default: ({ libraryID }) => libraryID + getUUID()
   *             // libraryID is available here because it is a key attribute!
   *           },
   *         }
   *       }
   *    ],
   *   },
   * };
   * ```
   */
  readonly default?: AttributeDefault;
  /** Methods for transforming the attribute value to/from the DB. */
  readonly transformValue?: {
    /** Fn to modify value before `validate` fn is called; use for normalization. */
    readonly toDB?: (inputValue: any) => unknown;
    /** Fn to modify value returned from DDB client; use to format/prettify values. */
    readonly fromDB?: (dbValue: any) => unknown;
  };
  /**
   * Custom attribute value validation function called for every write operation. The
   * value passed into this function is the "raw" value provided to the Model write
   * method (e.g., `createItem`), with the following schema-defined transformations in
   * order of execution:
   *
   * 1. With the exception of `updateItem` calls, any schema-defined `"default"`
   *    value will have been applied if the initial value is `undefined` or `null`.
   * 2. The `transformValue.toDB` function will have been applied, if defined.
   * 3. With the exception of `updateItem` calls, the `transformItem.toDB` function
   *    will have been applied, if defined.
   *
   * Note: `"enum"` attributes are validated using the array specified in the `oneOf`
   * attribute-config, and therefore do not require a custom `validate` function.
   */
  readonly validate?: (value: any) => boolean;
  /**
   * Optional boolean flag indicating whether a value is required for create-operations.
   * If `true`, an error will be thrown if the attribute value is `undefined` or `null`.
   * Note that this check is performed after all other schema-defined transformations
   * and validations have been applied.
   *
   * - Default: `false` for non-key attributes (keys are always required)
   * - Applies to the following methods:
   *   - `createItem`
   *   - `upsertItem`
   *   - `batchUpsertItems`
   */
  readonly required?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// ATTRIBUTE CONFIG TYPES:

/** Key attribute configs. */
export interface KeyAttributeConfig extends BaseAttributeConfig {
  /** The key attribute's DynamoDB type (keys can only be S, N, or B). */
  readonly type: "string" | "number" | "Buffer";
  /** Is attribute-value required flag (must be `true` for key attributes). */
  readonly required: true;
  /** Indicates the attribute is the table's hash key (default: `false`) */
  readonly isHashKey?: boolean;
  /** Indicates the attribute is the table's range key (default: `false`) */
  readonly isRangeKey?: boolean;
  /** DynamoDB index configs, provided on the index's hash key. */
  readonly index?: {
    /** The index name */
    readonly name: string;
    /** Is global index; pass `false` for local indexes (default: `true`). */
    readonly global?: boolean;
    /** The attribute which will serve as the index's range key, if any. */
    readonly rangeKey?: string;
    /** `true`: project ALL, `false`: project KEYS_ONLY, `string[]`: project listed attributes */
    readonly project?: boolean | Array<string>; //
    /** Don't set this when billing mode is PAY_PER_REQUEST */
    readonly throughput?: { readonly read: number; readonly write: number };
  };
}

/** Non-key attribute configs. */
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

/** Union of {@link ModelSchemaNestedMap} and {@link ModelSchemaNestedArray}. */
export type ModelSchemaNestedAttributes = ModelSchemaNestedMap | ModelSchemaNestedArray;
/** Type for "schema" defining nested array of attribute values. */
export type ModelSchemaNestedArray = ReadonlyArray<ModelSchemaAttributeConfig>;
/** Type for "schema" defining nested map of attribute values. */
export interface ModelSchemaNestedMap {
  readonly [nestedAttrName: string]: ModelSchemaAttributeConfig;
}

/** Union of all valid `Schema` attribute configs. */
export type UnionOfAttributeConfigs = KeyAttributeConfig | ModelSchemaAttributeConfig;

/**
 * This type reflects a "combination" of all possible attribute configs —
 * _**not**_ an intersection (see {@link CombineUnionOfObjects}).
 *
 * > This type is used for attribute configs when the parent schema type is
 * > unknown, as is the case in many methods of the base `Schema` class.
 */
export type AnyValidAttributeConfig = CombineUnionOfObjects<UnionOfAttributeConfigs>;

///////////////////////////////////////////////////////////////////////////////
// SCHEMA TYPES:

/** An attribute name / schema key. */
export type AttributeName = string;

/**
 * Type for the `TableKeys` schema; for `Model` schemas, instead use {@link ModelSchemaType}.
 */
export interface TableKeysSchemaType {
  readonly [keyAttrName: AttributeName]: KeyAttributeConfig;
}

/**
 * Type for a `Model` schema; for the `TableKeys` schema, instead use {@link TableKeysSchemaType}.
 * All `ModelSchemaType`s are given an index signature to allow for arbitrary attributes
 * to be defined, but the index signature is only used for non-key attributes; key
 * attributes must be explicitly defined and provided in the `TableKeysSchemaType` type
 * param.
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

/** Model config options to define item-level transformations and validations. */
export interface ModelSchemaOptions {
  /**
   * Whether write methods should add `"createdAt"` and `"updatedAt"` operation timestamps to
   * item parameters when creating or updating items respectively (default: `true`). Currently
   * only numerical unix timestamps are supported, but other formats like ISO-8601 strings may
   * be supported in the future if there is demand for it.
   *
   * When enabled, timestamp fields are added _before_ any `default` functions defined in your
   * schema are called, so your `default` functions can access the timestamp values for use cases
   * like UUID generation. For example, your schema could define a `"pk"` attribute with a `default`
   * function which generates a timestamp-based UUID using the `createdAt` value.
   */
  readonly autoAddTimestamps?: boolean;
  /**
   * Whether the Model allows items to include properties which aren't defined in its
   * schema on create/upsert operations (default: `false`). This may also be set to
   * an array of strings to only allow certain attributes - this can be useful if the
   * Model includes a `transformItem` function which adds properties to the item.
   */
  readonly allowUnknownAttributes?: boolean | Array<string>;
  /** Item-level transformations to/from the DB. */
  readonly transformItem?: {
    /** Fn to modify entire Item before `validate` fn is called. */
    readonly toDB?: (item: any) => BaseItem;
    /** Fn to modify entire Item returned from DDB client. */
    readonly fromDB?: (item: any) => BaseItem;
  };
  /** Item-level custom validation function. */
  readonly validateItem?: (item: any) => boolean;
}

///////////////////////////////////////////////////////////////////////////////
// SCHEMA METADATA TYPES:

/** Base type for Schema metadata properties. @internal */
export type SchemaMetadata = {
  schemaType: "ModelSchema" | "TableKeysSchema";
  name?: string;
  version?: string;
};

/** ModelSchema {@link SchemaMetadata | metadata properties }. @internal */
export type ModelSchemaMetadata = Simplify<
  SetOptional<SchemaMetadata, "schemaType"> & {
    schemaType?: "ModelSchema";
    name: string;
  }
>;

/** TableKeysSchema {@link SchemaMetadata | metadata properties }. @internal */
export type TableKeysSchemaMetadata = Simplify<
  SetOptional<SchemaMetadata, "schemaType"> & {
    schemaType?: "TableKeysSchema";
  }
>;

///////////////////////////////////////////////////////////////////////////////
// SCHMEA ENTRIES TYPES:

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
