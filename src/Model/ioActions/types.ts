import type { BaseItem, SupportedItemValueTypes } from "../../types/itemTypes";
import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaNestedAttributes,
  SchemaEntries,
} from "../../types/schemaTypes";
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
  /** Map of attribute names to their respective aliases (or name if none). */
  attributesToAliasesMap: AttributesAliasesMap;
  /** Map of attribute aliases to their respective attribute names. */
  aliasesToAttributesMap: AttributesAliasesMap;
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

/**
 * A function that performs an IO-Action.
 * @internal
 */
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
   * @remarks Even though IO-Actions only call `recursivelyApplyIOAction` when `itemValue` is a
   * nested object/array, this is not typed as `BaseItem | BaseItem[]` because that forces the
   * IO-Actions to perform type-checking which already occurs in `recursivelyApplyIOAction`, and
   * non-object/array values will not cause an error - they'd simply be returned as-is. The same
   * reasoning applies to the return type.
   */
  itemValue: SupportedItemValueTypes,
  ctx: RecursiveIOActionContext
) => SupportedItemValueTypes;

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
