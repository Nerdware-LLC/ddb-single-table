import type { ItemTypeOpts } from "./ItemTypeOpts.js";
import type { BaseAttributeConfig } from "../Schema/types/index.js";

/**
 * Returns an attribute's "alias" if `Opts.aliasKeys` is true AND it is configured with an
 * alias, otherwise this returns the attribute's name.
 */
export type AttrAliasOrName<
  T extends Record<string, BaseAttributeConfig>,
  K extends keyof T,
  Opts extends ItemTypeOpts,
> = Opts["aliasKeys"] extends true ? (T[K]["alias"] extends string ? T[K]["alias"] : K) : K;
