import { aliasMapping } from "./aliasMapping.js";
import { checkRequired } from "./checkRequired.js";
import { convertJsTypes } from "./convertJsTypes.js";
import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction.js";
import { setDefaults } from "./setDefaults.js";
import { transformItem } from "./transformItem.js";
import { transformValues } from "./transformValues.js";
import { typeChecking } from "./typeChecking.js";
import { validate } from "./validate.js";
import { validateItem } from "./validateItem.js";
import type { IOActions } from "./types.js";

/**
 * An object with various methods used to validate and transform items to/from the db.
 *
 * > This object serves as the `this` context for all `IOAction` functions.
 */
export const ioActions: IOActions = Object.freeze({
  /** Applies the provided `ioAction` to nested attributes. */
  recursivelyApplyIOAction,
  /** Swaps attribute names with their respective aliases. */
  aliasMapping,
  /** Applies any schema-defined defaults to request arguments. */
  setDefaults,
  /** Applies any `transformValue` functions defined in the schema. */
  transformValues,
  /** Applies the `transformItem` function (if defined in the Model's schema options). */
  transformItem,
  /** Checks attribute values for conformance with their schema-defined `type`. */
  typeChecking,
  /** Validates attribute values using `validate` functions defined in the schema. */
  validate,
  /** Uses `validateItem` function to validate an item in its entirety (if defined). */
  validateItem,
  /** Converts JS types to DynamoDB types and vice versa. */
  convertJsTypes,
  /** Performs nullish-value validation checks using `required` and `nullable` attr configs. */
  checkRequired,
});
