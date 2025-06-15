/**
 * `Opts` type param for item-type generics like `ItemTypeFromSchema` and `ItemCreationParameters`.
 */
export type ItemTypeOpts = {
  /** Whether to use attribute `alias` values for item keys rather than attribute names. */
  aliasKeys?: boolean;
  /** Whether to set item properties to optional if a `default` is provided. */
  optionalIfDefault?: boolean;
  /** Whether to add `null` to optional properties (i.e., convert `{ foo?: string }` to `{ foo?: string | null }`). */
  nullableIfOptional?: boolean;
  /** Whether to add `"createdAt"` and `"updatedAt"` timestamp attributes. */
  autoAddTimestamps?: boolean;
  /** Whether to replace all instances of `Date` with `string` (useful for mocking DDB responses). */
  convertDatesToStrings?: boolean;
};
