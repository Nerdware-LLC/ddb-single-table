import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaNestedAttributes,
  SchemaEntries,
} from "../types/schemaTypes";

/**
 * Labels indicating the direction data is flowing - either to or from the database.
 */
export type IODirection = "toDB" | "fromDB";

/**
 * The context object passed to IO-Action functions.
 */
interface BaseIOActionContext {
  /** The calling Model's name. */
  modelName: string;
  /** The calling Model's schema options. */
  schemaOptions: ModelSchemaOptions;
  /** `"toDB"` or `"fromDB"` */
  ioDirection: IODirection;
  /** Map of attribute names to their respective aliases (or name if none). */
  attributesToAliasesMap: Record<string, string>;
  /** Map of attribute aliases to their respective attribute names. */
  aliasesToAttributesMap: Record<string, string>;
  /** The parent item to which an attribute belongs. */
  parentItem?: Record<string, unknown>;
}
export interface IOActionContext extends BaseIOActionContext {
  schema: ModelSchemaType;
  /** Ordered array of schema entries. See {@link SchemaEntries}. */
  schemaEntries: SchemaEntries;
}
export interface RecursiveIOActionContext extends BaseIOActionContext {
  schema: ModelSchemaNestedAttributes;
}

/**
 * A function that performs an IO-Action.
 */
export type IOActionMethod = (
  this: IOActions,
  item: Record<string, unknown>,
  context: IOActionContext
) => Record<string, unknown>;

/**
 * A function that recursively applies a given IO-Action to an item and its nested attributes.
 */
export type RecursiveIOActionMethod = (
  this: IOActions,
  ioAction: IOActionMethod,
  itemValue: Required<unknown>,
  ctx: RecursiveIOActionContext
) => Required<unknown>;

/**
 * A dictionary to which all IO-Action functions belong.
 * > **This object serves as the `this` context for all IO-Action functions.**
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
