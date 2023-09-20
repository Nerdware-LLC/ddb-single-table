import type { ConditionalPick, ConditionalExcept, Simplify, OmitIndexSignature } from "type-fest";
import type {
  ModelSchemaType,
  BaseAttributeConfigProperties,
  ModelSchemaNestedMap,
  ModelSchemaNestedArray,
} from "./schemaTypes";
import type { NestDepthMax5, IterateNestDepth } from "./utilTypes";

/** An interface representing an Item with supported value types. */
export interface BaseItem {
  [key: string]: SupportedItemValueTypes;
}

/** Union of supported Item value types. */
export type SupportedItemValueTypes =
  | string
  | number
  | boolean
  | BaseItem
  | Array<SupportedItemValueTypes>
  | Date
  | Buffer
  | null
  | undefined;

/** An Item's keys (e.g., `{ id: "USER-1", sk: "FOO-SK" }`) */
export interface ItemKeys {
  [key: string]: string | number;
}

/**
 * Internal type defining `Opts` type param of item-type generics.
 * @internal
 */
type ItemTypeOptsParam = {
  /** Whether to use attribute `alias` values for item keys rather than attribute names. */
  aliasKeys?: boolean;
  /** Whether to set item properties to optional if a `default` is provided. */
  optionalIfDefault?: boolean;
  /** Whether to add `null` to optional properties (i.e., convert `{ foo?: string }` to `{ foo?: string | null }`). */
  nullableIfOptional?: boolean;
  /** Whether JS types should be replaced with Ddb types (i.e., convert `Date` to `number`). */
  useDdbTypes?: boolean;
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
  Opts extends ItemTypeOptsParam = {
    aliasKeys: true;
    optionalIfDefault: false;
    nullableIfOptional: true;
    useDdbTypes: false;
  },
  NestDepth extends NestDepthMax5 = 0,
> = Simplify<
  IterateNestDepth<NestDepth> extends 5 ? never : SchemaMappedToItem<T, Opts, NestDepth>
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
  { aliasKeys: true; optionalIfDefault: true; nullableIfOptional: true; useDdbTypes: false }
>;

/**
 * This generic creates a typing for the parameters necessary to update an Item.
 */
export type ItemParameters<T, NestDepth extends NestDepthMax5 = 0> = Simplify<
  IterateNestDepth<NestDepth> extends 5
    ? T
    : T extends Record<PropertyKey, unknown>
    ? keyof OmitIndexSignature<T> extends never
      ? Record<keyof T, ItemParameters<T[keyof T], IterateNestDepth<NestDepth>> | undefined>
      : { [K in keyof T]?: ItemParameters<T[K]> }
    : T extends Array<infer El>
    ? Array<ItemParameters<El, IterateNestDepth<NestDepth>>>
    : T
>;

/**
 * This generic creates a typing for the parameters necessary to update an Item.
 */
export type DynamoDbItemType<T, NestDepth extends NestDepthMax5 = 0> = Simplify<
  IterateNestDepth<NestDepth> extends 5
    ? T
    : T extends Date
    ? number
    : T extends Buffer
    ? string
    : T extends Record<PropertyKey, unknown>
    ? keyof OmitIndexSignature<T> extends never
      ? Record<keyof T, DynamoDbItemType<T[keyof T], IterateNestDepth<NestDepth>> | undefined>
      : { [K in keyof T]?: DynamoDbItemType<T[K]> }
    : T extends Array<infer El>
    ? Array<DynamoDbItemType<El, IterateNestDepth<NestDepth>>>
    : T
>;

/**
 * This type maps Item keys to values and makes the following access modifications:
 * - Removes readonly
 * - Adds/removes optionality based on "required" attribute configs and `Opts` type param.
 */
type SchemaMappedToItem<
  T extends Record<string, BaseAttributeConfigProperties>,
  Opts extends ItemTypeOptsParam,
  NestDepth extends NestDepthMax5,
> = {
  // prettier-ignore
  -readonly [K in keyof RequiredKeys<T, Opts> as AttrAliasOrName<T, K, Opts>]-?: AttributeValue<T[K], Opts, NestDepth>;
} & {
  -readonly [K in keyof T as AttrAliasOrName<T, K, Opts>]+?: Opts["nullableIfOptional"] extends true
    ? AttributeValue<T[K], Opts, NestDepth> | null
    : AttributeValue<T[K], Opts, NestDepth>;
};

/**
 * Returns an attribute's "alias" if `Opts.aliasKeys` is true AND it is configured with an alias,
 * otherwise this returns the attribute's name.
 * @internal
 */
export type AttrAliasOrName<
  T extends Record<string, BaseAttributeConfigProperties>,
  K extends keyof T,
  Opts extends { aliasKeys?: boolean } = { aliasKeys: true },
> = Opts["aliasKeys"] extends true ? (T[K]["alias"] extends string ? T[K]["alias"] : K) : K;

/**
 * Picks required keys from Item `<T>`. If `Opts.optionalIfDefault` is true, then
 * all properties that specify a `default` are also optional.
 * @internal
 */
type RequiredKeys<
  T extends Record<string, BaseAttributeConfigProperties>,
  Opts extends { optionalIfDefault?: boolean },
> = Opts["optionalIfDefault"] extends true
  ? ConditionalExcept<ConditionalPick<T, { required: true }>, { default: NonNullable<unknown> }>
  : ConditionalPick<T, { required: true }>;

/**
 * This generic gets the type from an individual attribute config from a Model schema.
 * > String literal types ftw!
 */
type AttributeValue<
  T extends BaseAttributeConfigProperties,
  Opts extends ItemTypeOptsParam,
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
  ? Opts["useDdbTypes"] extends true
    ? string // binary string
    : Buffer
  : T["type"] extends "Date"
  ? Opts["useDdbTypes"] extends true
    ? number // numerical unix timestamp
    : Date
  : T extends { type: "map"; schema: ModelSchemaNestedMap }
  ? ItemTypeFromSchema<T["schema"], Opts, IterateNestDepth<NestDepth>>
  : T extends { type: "array"; schema: ModelSchemaNestedArray }
  ? Array<AttributeValue<T["schema"][number], Opts, IterateNestDepth<NestDepth>>>
  : T extends { type: "enum"; oneOf: ReadonlyArray<string> }
  ? T["oneOf"][number]
  : never;

/** `T => T | Partial<T>` @internal */
type MaybePartialItem<T extends BaseItem> = T | Partial<T>;

/** `T => T | Partial<T> | Array<T> | Array<Partial<T>>` @internal */
export type OneOrMoreMaybePartialItems<T extends BaseItem> =
  | MaybePartialItem<T>
  | Array<MaybePartialItem<T>>;

/**
 * This generic is a bit of a hack to get `Model.processItemData.toDB/fromDB` methods to return
 * desired types for a given input. It's targeted for replacement in a future release.
 * @internal
 */
export type AscertainItemProcessingReturnType<
  ItemData extends OneOrMoreMaybePartialItems<BaseItem>,
  BaseItemType extends BaseItem,
  ItemTypeToReturn extends BaseItem,
> = ItemData extends Array<infer BatchItem>
  ? BatchItem extends BaseItemType
    ? Array<ItemTypeToReturn>
    : BatchItem extends Partial<BaseItemType>
    ? Array<Partial<ItemTypeToReturn>>
    : never
  : ItemData extends BaseItemType
  ? ItemTypeToReturn
  : ItemData extends Partial<BaseItemType>
  ? Partial<ItemTypeToReturn>
  : never;
