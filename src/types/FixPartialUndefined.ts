import type { Simplify, RequiredKeysOf, OptionalKeysOf } from "type-fest";

/**
 * This generic "fixes" the provided object's field partiality as follows:
 *
 * - Required fields have `undefined` removed.
 * - Optional fields are unioned with `undefined` to ensure the resultant type
 *   works regardless of whether `exactOptionalPropertyTypes` is enabled or not.
 */
export type FixPartialUndefined<T extends object> = Simplify<
  {
    [Key in RequiredKeysOf<T>]-?: Key extends keyof T ? Exclude<T[Key], undefined> : never;
  } & {
    [Key in OptionalKeysOf<T>]+?: Key extends keyof T
      ? Exclude<T[Key], undefined> | undefined // <-- fixes `string | undefined | undefined`
      : never;
  }
>;
