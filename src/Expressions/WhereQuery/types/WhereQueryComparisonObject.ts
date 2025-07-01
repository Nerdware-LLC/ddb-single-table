import type { WhereQueryOperator } from "./WhereQueryOperator.js";
import type { WhereQueryOperatorComparandsDict } from "./WhereQueryOperatorComparandsDict.js";
import type { SingleKeyObject, Simplify } from "type-fest";

/**
 * An object containing a single key which represents a comparison operator (e.g.,
 * `gt` for greater-than) and single comparand to use in the comparison.
 *
 * Each supported key maps to a valid DynamoDB `KeyConditionExpression` operator.
 * Between 1-2 of these objects are used to build a `KeyConditionExpression`.
 */
export type WhereQueryComparisonObject =
  | EqualityComparisonObject
  | LessThanComparisonObject
  | LessThanOrEqualToComparisonObject
  | GreaterThanComparisonObject
  | GreaterThanOrEqualToComparisonObject
  | BetweenComparisonObject
  | BeginsWithComparisonObject;

type SingleKeyComparisonObject<Operator extends WhereQueryOperator> = Simplify<
  SingleKeyObject<Pick<WhereQueryOperatorComparandsDict, Operator>> & {
    [OtherOps in Exclude<WhereQueryOperator, Operator>]?: never; // <-- Ensures only one operator is permitted
  }
>;

export type EqualityComparisonObject = SingleKeyComparisonObject<"eq">;
export type LessThanComparisonObject = SingleKeyComparisonObject<"lt">;
export type LessThanOrEqualToComparisonObject = SingleKeyComparisonObject<"lte">;
export type GreaterThanComparisonObject = SingleKeyComparisonObject<"gt">;
export type GreaterThanOrEqualToComparisonObject = SingleKeyComparisonObject<"gte">;
export type BetweenComparisonObject = SingleKeyComparisonObject<"between">;
export type BeginsWithComparisonObject = SingleKeyComparisonObject<"beginsWith">;

export type ShorthandEqualityComparison = EqualityComparisonObject["eq"];
