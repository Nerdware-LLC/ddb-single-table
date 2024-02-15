import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaNestedAttributes,
  SchemaEntries,
} from "../../Schema/types.js";
import type { BaseItem } from "../../types/itemTypes.js";
import type { AttributesAliasesMap } from "../types.js";

/**
 * Labels corresponding to the request/response cycle which indicate the "direction" data is flowing
 * - either to or from the database.
 */
export type IODirection = "toDB" | "fromDB";

/**
 * IO-Action context properties available to all IO-Action functions.
 * @internal
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
 * @internal
 */
export interface IOActionContext extends BaseIOActionContext {
  schema: ModelSchemaType;
  /** Ordered array of schema entries. See {@link SchemaEntries}. */
  schemaEntries: SchemaEntries;
}

/**
 * This extension of the {@link BaseIOActionContext} adds a `schema` property for the
 * {@link IOActionRecursiveApplicator} which is set to the [`schema` of a nested attribute][nested-schema] .
 *
 * [nested-schema]: {@link ModelSchemaNestedAttributes}
 *
 * @internal
 */
export interface RecursiveIOActionContext extends BaseIOActionContext {
  schema: ModelSchemaNestedAttributes;
}

/** A function that performs an IO-Action. @internal */
export type IOAction = (this: IOActions, item: BaseItem, context: IOActionContext) => BaseItem;

/**
 * A function that recursively applies a given IO-Action to an item and its nested attributes.
 * @internal
 */
export type IOActionRecursiveApplicator = (
  this: IOActions,
  ioAction: IOAction,
  /**
   * The item/items to which the IO-Action should be applied.
   * @remarks Even though IO-Actions only call `recursivelyApplyIOAction` when `attrValue` is a
   * nested object/array, this is not typed as `BaseItem | BaseItem[]` because that forces the
   * IO-Actions to perform type-checking which already occurs in `recursivelyApplyIOAction`, and
   * non-object/array values will not cause an error - they'd simply be returned as-is. The same
   * reasoning applies to the return type.
   */
  attrValue: unknown,
  ctx: RecursiveIOActionContext
) => unknown;

/**
 * A dictionary to which all IO-Action functions belong.
 * > **This object serves as the `this` context for all IO-Action functions.**
 * @internal
 */
export type IOActions = Readonly<
  {
    recursivelyApplyIOAction: IOActionRecursiveApplicator;
  } & Record<
    | "aliasMapping"
    | "setDefaults"
    | "transformValues"
    | "transformItem"
    | "typeChecking"
    | "validate"
    | "validateItem"
    | "convertJsTypes"
    | "checkRequired",
    IOAction
  >
>;

/** An array of enabled {@link IOAction} functions. @internal */
export type IOActionsSet = Array<IOAction>;

/**
 * Boolean flags for controlling which IO-Actions to use for a request or response. Model methods
 * define defaults for each flag which suit the methods purpose. For example, the `createItem`
 * method sets each flag to `true` by default, whereas the `updateItem` method defaults each flag
 * to `false`. Some flags only apply to certain methods, and/or a single `IODirection` (e.g.,
 * `setDefaults` is only applied to request arguments).
 */
export type EnabledIOActions = { [IOAction in keyof IOActions]?: boolean };
