import type { WhereQueryOperator } from "./WhereQueryOperator.js";
import type { WhereQueryOperatorComparandsDict } from "./WhereQueryOperatorComparandsDict.js";

/**
 * `WhereQuery` comparands are the values in {@link WhereQueryComparisonObject|WhereQuery objects}.
 *
 * An `Operator` type param can be provided to narrow the type of comparand to a specific operator.
 * For example, `WhereQueryComparand<"eq">` will be `string | number`.
 *
 * If not provided, this type will reflect a union of all possible comparand types.
 */
export type WhereQueryComparand<
  Operator extends WhereQueryOperator = WhereQueryOperator, //
> = Required<WhereQueryOperatorComparandsDict>[Operator];
