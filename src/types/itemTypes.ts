import type {
  ModelSchemaType,
  BaseAttributeConfig,
  AttributeDefault,
  ModelSchemaNestedMap,
  ModelSchemaNestedArray,
} from "../Schema/types.js";
import type { ConditionalPick, ConditionalExcept, Simplify } from "type-fest";

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
    nullableIfOptional: false;
    autoAddTimestamps: false;
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
  {
    aliasKeys: true;
    optionalIfDefault: true;
    nullableIfOptional: false;
    autoAddTimestamps: false;
  }
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
type ItemParametersValue<T, NestDepth extends NestDepthMax32> =
  IterateNestDepthMax32<NestDepth> extends 32
    ? never
    : T extends BaseItem
      ? { [K in keyof T]+?: ItemParametersValue<T[K], IterateNestDepthMax32<NestDepth>> }
      : T extends Array<infer El>
        ? Array<ItemParametersValue<El, IterateNestDepthMax32<NestDepth>>>
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
  NestDepth extends NestDepthMax32,
> = Simplify<
  SchemaMapRequiredAttrs<T, Opts, NestDepth> & SchemaMapOptionalAttrs<T, Opts, NestDepth>
>;

/** Maps required schema attributes for the purposes of deriving an ItemType. @internal */
type SchemaMapRequiredAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax32,
> = Simplify<{
  // prettier-ignore
  -readonly [K in keyof PickRequiredAttrs<T, Opts> as AttrAliasOrName<T, K, Opts>]-?: AttrValue<T[K], Opts, NestDepth>;
}>;

/** Maps optional schema attributes for the purposes of deriving an ItemType. @internal */
type SchemaMapOptionalAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax32,
> = Simplify<{
  -readonly [K in keyof T as AttrAliasOrName<T, K, Opts>]+?: Opts["nullableIfOptional"] extends true
    ? AttrValue<T[K], Opts, NestDepth> | null
    : AttrValue<T[K], Opts, NestDepth>;
}>;

/**
 * Picks required attributes from schema type `<T>`. If `Opts.optionalIfDefault` is true,
 * then all attribute configs that specify a `default` are also optional.
 * @internal
 */
type PickRequiredAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends { optionalIfDefault?: boolean },
> = Opts["optionalIfDefault"] extends true
  ? ConditionalExcept<ConditionalPick<T, { required: true }>, { default: AttributeDefault }>
  : ConditionalPick<T, { required: true }>;

/**
 * Returns an attribute's "alias" if `Opts.aliasKeys` is true AND it is configured with an
 * alias, otherwise this returns the attribute's name.
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
  NestDepth extends NestDepthMax32,
> =
  IterateNestDepthMax32<NestDepth> extends 32
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
                ? SchemaMapToItem<T["schema"], Opts, IterateNestDepthMax32<NestDepth>>
                : T extends { type: "array" | "tuple"; schema: ModelSchemaNestedArray }
                  ? Array<AttrValue<T["schema"][number], Opts, IterateNestDepthMax32<NestDepth>>>
                  : T extends { type: "enum"; oneOf: ReadonlyArray<string> }
                    ? T["oneOf"][number]
                    : never;

/**
 * This internal union represents the nest-depth of recursively mapped item/attribute types,
 * up to the [DynamoDB maximum nest-depth limit of 32][ddb-nest-max].
 *
 * [ddb-nest-max]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html#limits-attributes
 * @internal
 */
// prettier-ignore
type NestDepthMax32 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32;

/**
 * This internal generic takes a {@link NestDepthMax32|NestDepth} type parameter and returns
 * the next nest-depth value, up to a maximum of `32`.
 * @internal
 */
// prettier-ignore
type IterateNestDepthMax32<NestDepth extends NestDepthMax32 = 0> =
  NestDepth extends 0 ? 1
  : NestDepth extends 1 ? 2
  : NestDepth extends 2 ? 3
  : NestDepth extends 3 ? 4
  : NestDepth extends 4 ? 5
  : NestDepth extends 5 ? 6
  : NestDepth extends 6 ? 7
  : NestDepth extends 7 ? 8
  : NestDepth extends 8 ? 9
  : NestDepth extends 9 ? 10
  : NestDepth extends 10 ? 11
  : NestDepth extends 11 ? 12
  : NestDepth extends 12 ? 13
  : NestDepth extends 13 ? 14
  : NestDepth extends 14 ? 15
  : NestDepth extends 15 ? 16
  : NestDepth extends 16 ? 17
  : NestDepth extends 17 ? 18
  : NestDepth extends 18 ? 19
  : NestDepth extends 19 ? 20
  : NestDepth extends 20 ? 21
  : NestDepth extends 21 ? 22
  : NestDepth extends 22 ? 23
  : NestDepth extends 23 ? 24
  : NestDepth extends 24 ? 25
  : NestDepth extends 25 ? 26
  : NestDepth extends 26 ? 27
  : NestDepth extends 27 ? 28
  : NestDepth extends 28 ? 29
  : NestDepth extends 29 ? 30
  : NestDepth extends 30 ? 31
  : NestDepth extends 31 ? 32
  : 32;
