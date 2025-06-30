import type { IOActionContext, RecursiveIOActionContext } from "./IOActionContext.js";
import type { IODirection } from "./IODirection.js";
import type { BaseItem, SupportedAttributeValueType } from "../../types/index.js";

/**
 * A function that performs some transformation or validation on the provided `item`.
 */
export type IOAction = (
  this: IOActions,
  item: BaseItem,
  context: IOActionContext //
) => BaseItem;

/**
 * A function that recursively applies a given IO-Action to an item and its nested attributes.
 */
export type IOActionRecursiveApplicator = (
  this: IOActions,
  ioAction: IOAction,
  /**
   * The item/items to which the IO-Action should be applied.
   *
   * **NOTE:** Even though IO-Actions only call `recursivelyApplyIOAction` when `attrValue` is a
   * nested object/array, this is not typed as `BaseItem | BaseItem[]` because that forces the
   * IO-Actions to perform type-checking which already occurs in `recursivelyApplyIOAction`, and
   * non-object/array values will not cause an error — they'd simply be returned as-is. The same
   * reasoning applies to the return type.
   */
  attrValue: SupportedAttributeValueType,
  ctx: RecursiveIOActionContext
) => SupportedAttributeValueType;

/**
 * A dictionary to which all IO-Action functions belong.
 * > **This object serves as the `this` context for all IO-Action functions.**
 */
export type IOActions = Readonly<
  Record<IOActionName, IOAction> & {
    recursivelyApplyIOAction: IOActionRecursiveApplicator;
  }
>;

/**
 * The name of an IO-Action function.
 */
type IOActionName =
  | "aliasMapping"
  | "setDefaults"
  | "transformValues"
  | "transformItem"
  | "typeChecking"
  | "validate"
  | "validateItem"
  | "checkRequired";

/**
 * A mapping of IO-Directions to the names of IO-Actions available for that direction.
 */
interface IODirectionActionsMap {
  toDB: IOActionName;
  fromDB: Extract<IOActionName, "transformValues" | "transformItem" | "aliasMapping">;
}

/**
 * Boolean flags for controlling which IO-Actions to use for a request or response.
 */
export type EnabledIOActions<T extends IODirection> = {
  [IOAction in IODirectionActionsMap[T]]?: boolean;
};
