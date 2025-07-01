import type { IODirection } from "./IODirection.js";
import type { AttributesAliasesMap } from "../../Model/types/index.js";
import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaNestedAttributes,
  ModelSchemaEntries,
} from "../../Schema/types/index.js";
import type { BaseItem } from "../../types/index.js";

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
 * The IO-Action context object passed to the `IOActionRecursiveApplicator`.
 */
export interface RecursiveIOActionContext extends BaseIOActionContext {
  schema: ModelSchemaNestedAttributes;
}
