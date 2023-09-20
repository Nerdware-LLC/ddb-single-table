import { aliasMapping } from "./aliasMapping";
import { checkRequired } from "./checkRequired";
import { convertJsTypes } from "./convertJsTypes";
import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction";
import { setDefaults } from "./setDefaults";
import { transformItem } from "./transformItem";
import { transformValues } from "./transformValues";
import { typeChecking } from "./typeChecking";
import { validate } from "./validate";
import { validateItem } from "./validateItem";
import type { IOActions } from "./types";

/**
 * An object with various methods used to validate and transform items to/from the db.
 *
 * @type {IOActions}
 * @property {RecursiveIOActionMethod} recursivelyApplyIOAction - Applies any given `ioAction` to nested attributes of type "map" or "array".
 * @property {IOActionMethod} aliasMapping - Swaps attribute-names with their corresponding aliases.
 * @property {IOActionMethod} setDefaults - Applies attribute default values/functions when creating items.
 * @property {IOActionMethod} transformValues - Transforms attribute values using `transformValue` functions.
 * @property {IOActionMethod} transformItem - Transforms an entire item using the `transformItem` method.
 * @property {IOActionMethod} typeChecking - Checks item properties for conformance with their respective attribute "type".
 * @property {IOActionMethod} validate - Validates an item's individual properties using attribute's respective `"validate"` functions.
 * @property {IOActionMethod} validateItem - Validates an item in its entirety using the `validateItem` method.
 * @property {IOActionMethod} convertJsTypes - Converts JS types to DynamoDB types and vice versa.
 * @property {IOActionMethod} checkRequired - Checks an item for the existence of properties marked `required` in the schema.
 */
export const ioActions: IOActions = Object.freeze({
  /**
   * Applies any given `ioAction` to nested attributes of type "map" or "array".
   */
  recursivelyApplyIOAction,

  /**
   * This `IOActionMethod` swaps attribute-names with their corresponding
   * aliases:
   * - `toDB`: replaces "alias" keys with attribute names
   * - `fromDB`: replaces attribute names with "alias" keys
   */
  aliasMapping,

  /**
   * This `IOActionMethod` applies any `"default"`s defined in the schema in
   * the course of "create" operations. Attribute default values/functions are used
   * when the item either does not have the attribute (as determined by
   * `hasOwnProperty`), or the attribute value is `null` or `undefined`.
   *
   * > `UpdateItem` skips this action by default, since it is not a "create" operation.
   */
  setDefaults,

  /**
   * This `IOActionMethod` uses `transformValue` functions (if defined) to
   * transform attribute values before they are validated, converted to DynamoDB
   * types, etc.
   */
  transformValues,

  /**
   * This `IOActionMethod` uses the `transformItem` method (if defined in the
   * Model's schema options), to transform an entire item before it is sent to
   * the database. This is useful for potentially adding/removing/renaming item
   * properties, however **it may necessitate providing explicit Model type params
   * for `ItemOutput` and/or `ItemInput`, depending on the changes made.**
   */
  transformItem,

  /**
   * This `IOActionMethod` checks item properties for conformance with their
   * respective attribute "type" as defined in the schema.
   */
  typeChecking,

  /**
   * This `IOActionMethod` validates an item's individual properties using
   * attribute's respective `"validate"` functions provided in the schema.
   */
  validate,

  /**
   * This `IOActionMethod` uses the `validateItem` method provided in the
   * Model schema options to validate an item in its entirety.
   */
  validateItem,

  /**
   * This `IOActionMethod` converts JS types to DynamoDB types and vice versa.
   *
   * - `"Date"` Attributes
   *   - `toDB`: JS Date objects are converted to unix timestamps
   *   - `fromDB`: Unix timestamps are converted to JS Date objects
   * - `"Buffer"` Attributes
   *   - `toDB`: NodeJS Buffers are converted to binary strings
   *   - `fromDB`: Binary data is converted into NodeJS Buffers
   */
  convertJsTypes,

  /**
   * This `IOActionMethod` checks an item for the existence of properties
   * marked `required` in the schema, and throws an error if a required property is
   * not present (as indicated by `hasOwnProperty`), or its value is `null` or
   * `undefined`. This check occurs by default for the following Model methods:
   *
   * - `createItem`
   * - `upsertItem`
   * - `batchUpsertItems`
   * - `batchUpsertAndDeleteItems` (only the `upsertItems` clause)
   */
  checkRequired,
});
