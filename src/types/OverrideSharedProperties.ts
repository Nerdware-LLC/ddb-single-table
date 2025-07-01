/**
 * Type modifier that applies `Overrides` to the properties of `BaseType` if a
 * property exists in both `BaseType` and `Overrides`.
 *
 * > Unlike `type-fest`'s `OverrideProperties` generic, this type does not require
 * > the `Overrides` type to only contain properties that exist in `BaseType`.
 * > Instead, it allows `Overrides` to contain any properties, and will only apply
 * > those that exist in `BaseType`.
 */
export type OverrideSharedProperties<BaseType extends object, Overrides extends object> = {
  [Key in keyof BaseType]: Key extends keyof Overrides
    ? Overrides[Key]
    : Key extends keyof BaseType
      ? BaseType[Key]
      : never;
};
