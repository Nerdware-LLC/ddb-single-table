import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaNestedAttributes,
  SchemaEntries,
} from "../../Schema";
import type { BaseItem } from "../../types/itemTypes";
import type { AttributesAliasesMap } from "../types";

/**
 * Labels indicating the direction data is flowing - either to or from the database.
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
 * {@link RecursiveIOActionMethod} which is set to the [`schema` of a nested attribute][nested-schema] .
 *
 * [nested-schema]: {@link ModelSchemaNestedAttributes}
 *
 * @internal
 */
export interface RecursiveIOActionContext extends BaseIOActionContext {
  schema: ModelSchemaNestedAttributes;
}

/** A function that performs an IO-Action. @internal */
export type IOActionMethod = (
  this: IOActions,
  item: BaseItem,
  context: IOActionContext
) => BaseItem;

/**
 * A function that recursively applies a given IO-Action to an item and its nested attributes.
 * @internal
 */
export type RecursiveIOActionMethod = (
  this: IOActions,
  ioAction: IOActionMethod,
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
    recursivelyApplyIOAction: RecursiveIOActionMethod;
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
    IOActionMethod
  >
>;

/** An array of enabled {@link IOActionMethod} functions. @internal */
export type IOActionsSet = Array<IOActionMethod>;

/**
 * Boolean flags for controlling which IO-Actions to include in a given set. Model methods define
 * defaults for each flag which suit the methods purpose. For example, the `createItem` method sets
 * each flag to `true` by default, whereas the `updateItem` method defaults each flag to `false`.
 * Some flags only apply to certain methods, and/or a single `IODirection` (e.g., `setDefaults` is
 * only used in `toDB` sets, and therefore only applies to write methods).
 */
export type EnabledIOActions = { [IOAction in keyof IOActions]?: boolean };
