import type { ItemTypeFromSchema } from "./ItemTypeFromSchema.js";
import type { ItemTypeOpts } from "./ItemTypeOpts.js";
import type { ModelSchemaType } from "../Schema/types/index.js";

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
export type ItemCreationParameters<
  T extends ModelSchemaType,
  Opts extends ItemTypeOpts = {
    aliasKeys: true;
    optionalIfDefault: true;
    nullableIfOptional: false;
    autoAddTimestamps: false;
  },
> = ItemTypeFromSchema<T, Opts>;
