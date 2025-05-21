import type { SupportedAttributeValueType } from "../../types/index.js";

/**
 * Union of {@link SupportedAttributeValueType|attr value types} represented as string literals.
 */
export type SchemaSupportedTypeStringLiteral =
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
 * Union of supported types for {@link BaseAttributeConfig.default|schema `default` configs}.
 */
export type AttributeDefault =
  | SupportedAttributeValueType
  | ((item: any) => SupportedAttributeValueType);

/**
 * Base attribute configs common to all attribute types.
 */
export interface BaseAttributeConfig {
  /**
   * The attribute's name outside of the database (e.g., alias "id" for attribute "pk").
   * During write operations, if the object provided to the Model method contains a key
   * matching a schema-defined `alias` value, the key is replaced with the attribute's
   * name. For both read and write operations, when data is returned from the database,
   * this key-switch occurs in reverse — any object keys which match an attribute with a
   * defined `alias` will be replaced with their respective `alias`. Note that all `alias`
   * values must be unique — the Model's constructor will throw an error if the schema
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
  readonly type: SchemaSupportedTypeStringLiteral;

  /**
   * Specifies allowed values for attributes of `type: "enum"`.
   */
  readonly oneOf?: ReadonlyArray<string>;

  /**
   * ### `default`
   * Optional attribute default value to apply. This can be configured as either a straight-forward
   * primitive value, or a function which returns a default value. With the exception of `updateItem`
   * calls, an attribute's value is set to this `default` if the initial value provided to the Model
   * method is `undefined` or `null`. If one key is derived from another, this default is also
   * applied to `Where`-query args and other related APIs.
   *
   * #### Usage Notes:
   *
   * - ##### When using a primitive-value `default`:
   *   - The primitive's type must match the attribute's `type`, otherwise the Model's
   *     constructor will throw an error.
   *
   * - ##### When using a function `default`:
   *   - The function is called with the entire item-object provided to the Model method _**with
   *     UNALIASED keys**_, and the attribute value is set to the function's returned value.
   *   - _This package does not validate functional `default`s._
   *
   * Bear in mind that key and index attributes are always processed _before_ all other attributes,
   * thereby making them available to use in `default` functions for other attributes. For example,
   * in the below `LibraryModelSchema`, each `authorID` is generated using the `unaliasedPK` plus a
   * UUID:
   * ```ts
   * const LibraryModelSchema = {
   *   unaliasedPK: {
   *     isHashKey: true,
   *     type: "string",
   *     default: () => makeLibraryID(),
   *     alias: "libraryID",  // <-- NOTE: This alias will NOT be available
   *                          //     in the below authorID `default` function.
   *   },
   *   authors: {
   *     type: "array",
   *     schema: [
   *       {
   *         type: "map",
   *         schema: {
   *           authorID: {
   *             type: "string",
   *             default: (entireLibraryItem) => {
   *               // unaliasedPK is available here because it is a key attribute!
   *               return entireLibraryItem.unaliasedPK + getUUID();
   *             }
   *           }
   *         }
   *       }
   *     ]
   *   }
   * };
   * ```
   */
  readonly default?: AttributeDefault;

  /**
   * Methods for transforming the attribute value to/from the DB.
   */
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
   * Optional boolean flag indicating whether a value may be `null`. If
   * `false`, an error will be thrown if the attribute value is `null`.
   *
   * - Default: `false` for non-key attributes (keys are never nullable)
   * - Applies to the following methods:
   *   - `createItem`
   *   - `upsertItem`
   *   - `batchUpsertItems`
   */
  readonly nullable?: boolean;

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
