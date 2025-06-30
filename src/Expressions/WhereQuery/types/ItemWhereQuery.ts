import type {
  WhereQueryComparisonObject,
  ShorthandEqualityComparison,
} from "./WhereQueryComparisonObject.js";
import type { BaseItem, UnknownItem } from "../../../types/index.js";

/**
 * An object containing _exactly_ one or two item attributes mapped to corresponding
 * {@link WhereQueryComparisonObject|WhereQuery comparison objects} _or_ string/number
 * primitive values. If string/number primitives are provided, they are treated as
 * short-hand equality comparisons (see example below).
 *
 * @example
 * ```ts
 * // Example ItemWhereQuery showing both short-hand and long-hand equality comparisons:
 * const whereQuery: ItemWhereQuery = {
 *   fooPK: "x",        // ← Short-hand equality comparison syntax
 *   mySK: { eq: "x" }, // ← Long-hand equality comparison syntax
 * };
 * ```
 */
export type ItemWhereQuery<Item extends UnknownItem = BaseItem> = {
  [AttrName in keyof Item]?: WhereQueryComparisonObject | ShorthandEqualityComparison;
};
