import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaNestedAttributes,
  ModelSchemaEntries,
} from "../../Schema/types/index.js";
import type { BaseItem } from "../../types/index.js";
import type { AttributesAliasesMap } from "../types/index.js";

/**
 * Labels corresponding to the request-response cycle which indicate the
 * "direction" data is flowing — either to or from the database.
 */
export type IODirection = "toDB" | "fromDB";

/**
 * IO-Action context properties available to all IO-Action functions.
 */
interface BaseIOActionContext {
  /** The calling Model's name. */
  modelName: string;
  /** The calling Model's schema options. */
  schemaOptions: ModelSchemaOptions;
  /** `"toDB"` or `"fromDB"` */
  ioDirection: IODirection;
  /** Map of attribute names to/from their respective aliases, depending on the `ioDirection`. */
  aliasesMap: AttributesAliasesMap;
  /** The parent item to which an attribute belongs. */
  parentItem?: BaseItem;
}

/**
 * The IO-Action context object passed to all IO-Action functions.
 */
export interface IOActionContext extends BaseIOActionContext {
  schema: ModelSchemaType;
  /** Ordered array of schema entries. See {@link ModelSchemaEntries}. */
  schemaEntries: ModelSchemaEntries;
}

/**
 * This extension of the {@link BaseIOActionContext} adds a `schema` property
 * for the {@link IOActionRecursiveApplicator} which is set to the
 * {@link ModelSchemaNestedAttributes|`schema` of a nested attribute}.
 */
export interface RecursiveIOActionContext extends BaseIOActionContext {
  schema: ModelSchemaNestedAttributes;
}

/**
 * A function that performs an IO-Action.
 */
export type IOAction = (this: IOActions, item: BaseItem, context: IOActionContext) => BaseItem;

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
  attrValue: unknown,
  ctx: RecursiveIOActionContext
) => unknown;

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
  | "convertJsTypes"
  | "checkRequired";

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
 * An array of enabled {@link IOAction} functions.
 */
export type IOActionsSet = Array<IOAction>;

/**
 * The name of a `toDB` IO-Action.
 */
type ToDbIOActionName = IOActionName;

/**
 * The name of a `fromDB` IO-Action.
 */
type FromDbIOActionName = Extract<
  IOActionName,
  "convertJsTypes" | "transformValues" | "transformItem" | "aliasMapping"
>;

/**
 * Boolean flags for controlling which IO-Actions to use for a request or response.
 */
export type EnabledIOActions<T extends IODirection> = T extends "toDB"
  ? { [IOAction in ToDbIOActionName]?: boolean }
  : T extends "fromDB"
    ? { [IOAction in FromDbIOActionName]?: boolean }
    : never;
