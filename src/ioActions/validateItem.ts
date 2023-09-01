import { ItemInputError } from "../utils";
import type { IOActions, IOActionMethod } from "./types";

/**
 * This `IOActionMethod` uses the `validateItem` method provided in the
 * Model schema options to validate an item in its entirety.
 */
export const validateItem: IOActionMethod = function (
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
