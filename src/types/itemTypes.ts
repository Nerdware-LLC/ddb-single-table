import type { ConditionalPick, ConditionalExcept, Simplify } from "type-fest";
import type {
  ModelSchemaType,
  BaseAttributeConfig,
  AttributeDefault,
  ModelSchemaNestedMap,
  ModelSchemaNestedArray,
} from "../Schema";
import type { NestDepthMax5, IterateNestDepth } from "./utilTypes";

/** An interface representing an Item with supported value types. */
export interface BaseItem {
  [key: string]: unknown;
}

/** Union of supported Item value types for this package. */
export type SupportedAttributeValueTypes =
  | string
  | number
  | boolean
  | Date
  | Buffer
  | BaseItem
  | Array<SupportedAttributeValueTypes>
  | null
  | undefined;

/** An Item's keys (e.g., `{ id: "USER-1", sk: "FOO-SK" }`) */
export interface ItemKeys {
  [key: string]: string | number;
}

/** Operation timestamp attributes. */
export type TimestampAttributes = {
  createdAt: Date;
  updatedAt: Date;
};

/** Internal type defining `Opts` type param of item-type generics. @internal */
type ItemTypeOpts = {
  /** Whether to use attribute `alias` values for item keys rather than attribute names. */
  aliasKeys?: boolean;
  /** Whether to set item properties to optional if a `default` is provided. */
  optionalIfDefault?: boolean;
  /** Whether to add `null` to optional properties (i.e., convert `{ foo?: string }` to `{ foo?: string | null }`). */
  nullableIfOptional?: boolean;
  /** Whether to add `"createdAt"` and `"updatedAt"` timestamp attributes. */
  autoAddTimestamps?: boolean;
};

/**
 * This generic creates an Item type from the provided Model schema.
 *
 * @example
 * ```ts
 * // This Model schema yields the UserItem type definition (see below)
 * const userModelSchema = {
 *   pk: { alias: "userID", type: "string", required: true },
 *   sk: { type: "string", required: true, default: () => `#USER_SK#${Date.now()}` },
 *   data: {
 *     alias: "job",
 *     type: "map",
 *     schema: {
 *       fooNestedKey: { alias: "JobTitle", type: "string", required: true }
 *     }
 *   },
 *   favoriteFood: {
 *     type: "enum",
 *     oneOf: ["APPLES", "CAKE", "PIZZA"]
 *   },
 *   hobbies: {
 *     alias: "userHobbies",
 *     type: "array",
 *     schema: [{ type: "string" }]
 *   },
 *   listOfPlaces: {
 *     type: "array",
 *     required: true,
 *     schema: [
 *       {
 *         type: "map",
 *         schema: {
 *           placeName: { type: "string", required: true },
 *           address: { type: "string" }
 *         }
 *       }
 *     ]
 *   }
 * } as const;
 *
 * type UserItem = ItemTypeFromSchema<typeof userModelSchema>;
 * // Resultant UserItem type is equivalent to the type below
 * type UserItemEquivalent = {
 *   userID: string;
 *   sk: string;
 *   job?: {
 *     JobTitle: string;
 *   } | undefined;
 *   favoriteFood?: "APPLES" | "CAKE" | "PIZZA" | undefined;
 *   userHobbies?: Array<string> | undefined;
 *   listOfPlaces: Array<{
 *     placeName: string;
 *     address?: string | undefined;
 *   }>;
 * }
 * ```
 */
export type ItemTypeFromSchema<
  T extends ModelSchemaType,
  Opts extends ItemTypeOpts = {
    aliasKeys: true;
    optionalIfDefault: false;
    nullableIfOptional: true;
    autoAddTimestamps: true;
  },
> = Simplify<
  Opts["autoAddTimestamps"] extends true
    ? SchemaMapToItem<T, Opts, 0> & TimestampAttributes
    : SchemaMapToItem<T, Opts, 0>
>;

/**
 * This generic creates a typing for the parameters necessary to create an Item.
 * Note that attributes with a defined `default` are made optional.
 *
 * @example
 * ```ts
 * // This Model schema yields the UserItem type definition (see below)
 * const userModelSchema = {
 *   pk: { alias: "userID", type: "string", required: true },
 *   sk: { type: "string", required: true, default: () => `#USER_SK#${Date.now()}` },
 *   data: {
 *     alias: "job",
 *     type: "map",
 *     schema: {
 *       fooNestedKey: { alias: "JobTitle", type: "string", required: true }
 *     }
 *   },
 *   favoriteFood: {
 *     type: "enum",
 *     oneOf: ["APPLES", "CAKE", "PIZZA"]
 *   },
 *   hobbies: {
 *     alias: "userHobbies",
 *     type: "array",
 *     schema: [{ type: "string" }]
 *   },
 *   listOfPlaces: {
 *     type: "array",
 *     required: true,
 *     schema: [
 *       {
 *         type: "map",
 *         schema: {
 *           placeName: { type: "string", required: true },
 *           address: { type: "string" }
 *         }
 *       }
 *     ]
 *   }
 * } as const;
 *
 * type UserItem = ItemCreationParameters<typeof userModelSchema>;
 * // Resultant UserItem type is equivalent to the type below
 * type UserItemEquivalent = {
 *   userID: string;
 *   sk?: string | undefined; // <-- Note that sk is optional on input items
 *   job?: {
 *     JobTitle: string;
 *   } | undefined;
 *   favoriteFood?: "APPLES" | "CAKE" | "PIZZA" | undefined;
 *   userHobbies?: Array<string> | undefined;
 *   listOfPlaces: Array<{
 *     placeName: string;
 *     address?: string | undefined;
 *   }>;
 * }
 * ```
 */
export type ItemCreationParameters<T extends ModelSchemaType> = ItemTypeFromSchema<
  T,
  { aliasKeys: true; optionalIfDefault: true; nullableIfOptional: true; autoAddTimestamps: false }
>;

/**
 * This generic creates a typing for the parameters necessary to update an Item.
 */
export type ItemParameters<ItemCreationParams extends BaseItem> = Simplify<
  ItemParametersValue<ItemCreationParams, 0>
>;

/**
 * This generic creates a typing for the parameters necessary to update an Item.
 * @internal
 */
type ItemParametersValue<T, NestDepth extends NestDepthMax5> = IterateNestDepth<NestDepth> extends 5
  ? never
  : T extends BaseItem
  ? { [K in keyof T]+?: ItemParametersValue<T[K], IterateNestDepth<NestDepth>> }
  : T extends Array<infer El>
  ? Array<ItemParametersValue<El, IterateNestDepth<NestDepth>>>
  : T;

/**
 * This type maps schema attribute names to values and makes the following access modifications:
 * - Removes readonly
 * - Adds/removes optionality based on "required" attribute configs and `Opts` type param.
 * @internal
 */
type SchemaMapToItem<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax5,
> = Simplify<
  SchemaMapRequiredAttrs<T, Opts, NestDepth> & SchemaMapOptionalAttrs<T, Opts, NestDepth>
>;

/** Maps required schema attributes for the purposes of deriving an ItemType. @internal */
type SchemaMapRequiredAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax5,
> = Simplify<{
  // prettier-ignore
  -readonly [K in keyof PickRequiredAttrs<T, Opts> as AttrAliasOrName<T, K, Opts>]-?: AttrValue<T[K], Opts, NestDepth>;
}>;

/** Maps optional schema attributes for the purposes of deriving an ItemType. @internal */
type SchemaMapOptionalAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax5,
> = Simplify<{
  -readonly [K in keyof T as AttrAliasOrName<T, K, Opts>]+?: Opts["nullableIfOptional"] extends true
    ? AttrValue<T[K], Opts, NestDepth> | null
    : AttrValue<T[K], Opts, NestDepth>;
}>;

/**
 * Picks required attributes from schema type `<T>`. If `Opts.optionalIfDefault` is true, then all
 * attribute configs that specify a `default` are also optional.
 * @internal
 */
type PickRequiredAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends { optionalIfDefault?: boolean },
> = Opts["optionalIfDefault"] extends true
  ? ConditionalExcept<ConditionalPick<T, { required: true }>, { default: AttributeDefault }>
  : ConditionalPick<T, { required: true }>;

/**
 * Returns an attribute's "alias" if `Opts.aliasKeys` is true AND it is configured with an alias,
 * otherwise this returns the attribute's name.
 * @internal
 */
export type AttrAliasOrName<
  T extends Record<string, BaseAttributeConfig>,
  K extends keyof T,
  Opts extends { aliasKeys?: boolean },
> = Opts["aliasKeys"] extends true ? (T[K]["alias"] extends string ? T[K]["alias"] : K) : K;

/**
 * This generic gets the type from an individual attribute config from a Model schema.
 * > String literal types ftw!
 * @internal
 */
type AttrValue<
  T extends BaseAttributeConfig,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax5,
> = IterateNestDepth<NestDepth> extends 5
  ? never
  : T["type"] extends "string"
  ? string
  : T["type"] extends "number"
  ? number
  : T["type"] extends "boolean"
  ? boolean
  : T["type"] extends "Buffer"
  ? Buffer
  : T["type"] extends "Date"
  ? Date
  : T extends { type: "map"; schema: ModelSchemaNestedMap }
  ? SchemaMapToItem<T["schema"], Opts, IterateNestDepth<NestDepth>>
  : T extends { type: "array" | "tuple"; schema: ModelSchemaNestedArray }
  ? Array<AttrValue<T["schema"][number], Opts, IterateNestDepth<NestDepth>>>
  : T extends { type: "enum"; oneOf: ReadonlyArray<string> }
  ? T["oneOf"][number]
  : never;
