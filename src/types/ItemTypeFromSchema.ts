import type { AttrAliasOrName } from "./AttrAliasOrName.js";
import type { ItemTypeOpts } from "./ItemTypeOpts.js";
import type { NestDepthMax32, IterateNestDepthMax32 } from "./NestDepth.js";
import type { TimestampAttributes } from "./TimestampAttributes.js";
import type {
  BaseAttributeConfig,
  AttributeDefault,
  ModelSchemaType,
  ModelSchemaNestedMap,
  ModelSchemaNestedArray,
} from "../Schema/types/index.js";
import type { ConditionalPick, ConditionalExcept, Simplify } from "type-fest";

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
    convertDatesToStrings: false;
  },
> = Simplify<
  Opts["autoAddTimestamps"] extends true
    ? SchemaMapToItem<T, Opts, 0> & TimestampAttributes
    : SchemaMapToItem<T, Opts, 0>
>;

/**
 * This type maps schema attribute names to values and makes the following access modifications:
 * - Removes readonly
 * - Adds/removes optionality based on "required" attribute configs and `Opts` type param.
 */
type SchemaMapToItem<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax32,
> = Simplify<
  SchemaMapRequiredAttrs<T, Opts, NestDepth> & SchemaMapOptionalAttrs<T, Opts, NestDepth>
>;

/**
 * Maps required schema attributes for the purposes of deriving an ItemType.
 */
type SchemaMapRequiredAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax32,
> = Simplify<{
  // prettier-ignore
  -readonly [K in keyof PickRequiredAttrs<T, Opts> as AttrAliasOrName<T, K, Opts>]-?: AttrValue<T[K], Opts, NestDepth>;
}>;

/**
 * Maps optional schema attributes for the purposes of deriving an ItemType.
 */
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
 */
type PickRequiredAttrs<
  T extends Record<string, BaseAttributeConfig>,
  Opts extends { optionalIfDefault?: boolean },
> = Opts["optionalIfDefault"] extends true
  ? ConditionalExcept<ConditionalPick<T, { required: true }>, { default: AttributeDefault }>
  : ConditionalPick<T, { required: true }>;

/**
 * This generic gets the type from an individual attribute config from a Model schema.
 */
// prettier-ignore
export type AttrValue<
  T extends BaseAttributeConfig,
  Opts extends ItemTypeOpts,
  NestDepth extends NestDepthMax32,
> =
  T["type"] extends "string"
    ? CheckNullable<string, T>
  : T["type"] extends "number"
    ? CheckNullable<number, T>
  : T["type"] extends "boolean"
    ? CheckNullable<boolean, T>
  : T["type"] extends "Buffer"
    ? CheckNullable<Buffer, T>
  : T["type"] extends "Date"
    ? CheckNullable<
        Opts["convertDatesToStrings"] extends true ? string : Date,
        T
      >
  : T extends { type: "enum"; oneOf: ReadonlyArray<string> }
    ? CheckNullable<T["oneOf"][number], T>
  : NestDepth extends 32 // <-- Only nested types remain, so ensure NestDepth is not already maxed out.
    ? never
  : T extends { type: "map"; schema: ModelSchemaNestedMap }
    ? CheckNullable<
        SchemaMapToItem<T["schema"], Opts, IterateNestDepthMax32<NestDepth>>,
        T
      >
  : T extends { type: "array" | "tuple"; schema: ModelSchemaNestedArray }
    ? CheckNullable<
        Array<AttrValue<T["schema"][number], Opts, IterateNestDepthMax32<NestDepth>>>,
        T
      >
  : never; // <-- Indicates an invalid "type" in the schema.

/**
 * This internal utility type checks if the `AttrConfig` specifies `nullable: true`,
 * and if so, returns the `BaseType` unioned with `null`, otherwise just `BaseType`.
 */
type CheckNullable<
  BaseType,
  AttrConfig extends BaseAttributeConfig,
> = AttrConfig["nullable"] extends true ? BaseType | null : BaseType;
