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
 * > This object serves as the `this` context for all `IOAction` functions.
 *
 * @type {IOActions}
 * @property `recursivelyApplyIOAction` - Applies an `IOAction` to nested attribute types.
 * @property `aliasMapping` - Swaps attribute names with their respective aliases.
 * @property `setDefaults` - Applies attribute defaults defined in the schema.
 * @property `transformValues` - Transforms attribute values using `transformValue` functions.
 * @property `transformItem` - Transforms an entire item using the `transformItem` method.
 * @property `typeChecking` - Checks item properties for conformance with their respective `type`.
 * @property `validate` - Validates an item's attributes using their respective `validate` functions.
 * @property `validateItem` - Validates an item in its entirety using the user's `validateItem` function.
 * @property `convertJsTypes` - Converts JS types to DynamoDB types and vice versa.
 * @property `checkRequired` - Checks an item for the existence of properties marked `required` in the schema.
 */
export const ioActions: IOActions = Object.freeze({
  /**
   * Applies the provided `ioAction` to nested attributes.
   */
  recursivelyApplyIOAction,

  /**
   * This `IOAction` swaps attribute names with their respective aliases:
   * - `toDB`: replaces "alias" keys with attribute names
   * - `fromDB`: replaces attribute names with "alias" keys
   */
  aliasMapping,

  /**
   * This `IOAction` applies any schema-defined defaults to request arguments. Attribute default
   * values/functions are used when the item either does not have the attribute (as determined by
   * `hasOwnProperty`), or the attribute value is `null` or `undefined`.
   */
  setDefaults,

  /**
   * This `IOAction` uses `transformValue` functions (if defined) to transform attribute values
   * before they are validated, converted to DynamoDB types, etc.
   */
  transformValues,

  /**
   * This `IOAction` uses the `transformItem` method (if defined in the Model's schema options), to
   * transform an entire item before it is sent to the database. This is useful for potentially
   * adding/removing/renaming item properties, however **it may necessitate providing explicit Model
   * type params, depending on the changes made.**
   */
  transformItem,

  /**
   * This `IOAction` checks attribute values for conformance with their schema-defined `type`.
   */
  typeChecking,

  /**
   * This `IOAction` validates attribute values using `validate` functions defined in the schema.
   */
  validate,

  /**
   * This `IOAction` uses `SchemaOptions.validateItem` to validate an item in its entirety.
   */
  validateItem,

  /**
   * This `IOAction` converts JS types to DynamoDB types and vice versa.
   *
   * - `"Date"` Attributes
   *   - `toDB`: JS Date objects are converted to unix timestamps
   *   - `fromDB`: Unix timestamps are converted to JS Date objects
   * - `"Buffer"` Attributes
   *   - `toDB`: NodeJS Buffers are converted to binary strings
   *   - `fromDB`: Binary strings are converted into NodeJS Buffers
   */
  convertJsTypes,

  /**
   * This `IOAction` checks an item for the existence of properties marked `required` in the schema,
   * and throws an error if a required property is not present (as indicated by `hasOwnProperty`),
   * or its value is `null` or `undefined`.
   */
  checkRequired,
});
