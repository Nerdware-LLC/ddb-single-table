import { isFunction } from "@nerdware/ts-type-safety-utils";
import type { IOActions, IOAction } from "./types.js";

/**
 * This `IOAction` uses the `transformItem` method (if defined in the Model's
 * schema options), to transform an entire item before it is sent to the database.
 * This is useful for potentially adding/removing/renaming item properties, however
 * **it may necessitate providing explicit Model type params for `ItemOutput` and/or
 * `ItemInput`, depending on the changes made.**
 */
export const transformItem: IOAction = function (
  this: IOActions,
  item,
  { schemaOptions, ioDirection }
) {
  // If schemaOptions has transformItem toDB/fromDB, pass the existing item into the fn
  const transformItem = schemaOptions?.transformItem?.[ioDirection];

  // If the new item has type mismatches, they're caught by the `typeChecking` method
  if (isFunction(transformItem)) item = transformItem(item);

  return item;
};
