import type { WhereQueryOperatorComparandsDict } from "./WhereQueryOperatorComparandsDict.js";
import type { Simplify } from "type-fest";

/**
 * Union of `WhereQuery` operators.
 */
export type WhereQueryOperator = Simplify<keyof WhereQueryOperatorComparandsDict>;
