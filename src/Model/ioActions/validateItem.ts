import { ItemInputError } from "../../utils/errors.js";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` uses the `validateItem` method provided in the
 * Model schema options to validate an item in its entirety.
 */
export const validateItem: IOAction = function (
  this: IOActions,
  item,
  { schemaOptions, modelName }
) {
  // If schemaOptions has validateItem, pass the existing item into the fn
  if (
    typeof schemaOptions?.validateItem === "function" &&
    schemaOptions.validateItem(item) === false
  ) {
    throw new ItemInputError(`Invalid ${modelName} item.`);
  }
  return item;
};
