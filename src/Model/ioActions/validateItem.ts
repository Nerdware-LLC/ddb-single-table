import { isFunction } from "@nerdware/ts-type-safety-utils";
import { ItemInputError } from "../../utils/errors.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` uses `modelSchemaOptions.validateItem` to validate an item in its entirety.
 *
 * @throws {ItemInputError} If the `validateItem` function returns `false`.
 */
export const validateItem: IOAction = function (
  this: IOActions,
  item,
  { modelName, schemaOptions: { validateItem } }
) {
  // If schemaOptions has validateItem, pass the existing item into the fn
  if (isFunction(validateItem) && validateItem(item) === false)
    throw new ItemInputError(`Invalid ${modelName} item.`);

  return item;
};
