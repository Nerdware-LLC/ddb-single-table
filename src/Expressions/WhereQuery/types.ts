/**
 * An object containing a single key which represents a comparison operator (e.g., `gt`
 * for greater-than) and single comparand to use in the comparison.
 *
 * Each supported key maps to a valid DynamoDB `KeyConditionExpression` operator.
 * Between 1-2 of these objects are used to build a `KeyConditionExpression`.
 */
export interface WhereQueryComparisonObject {
  /** Equals (`fooKey === x`) */
  eq?: string | number;
  /** Less than (`fooKey < x`) */
  lt?: string | number;
  /** Less than or equal to (`fooKey <= x`) */
  lte?: string | number;
  /** Greater than (`fooKey > x`) */
  gt?: string | number;
  /** Greater than or equal to (`fooKey >= x`) */
  gte?: string | number;
  /** `fooKey BETWEEN x AND z` */
  between?: [string, string] | [number, number];
  /** `begins_with( fooKey, "fooVal" )` */
  beginsWith?: string;
}

/**
 * `WhereQuery` operators: `eq`, `lt`, `lte`, `gt`, `gte`, `between`, `beginsWith`
 */
export type WhereQueryOperator = keyof WhereQueryComparisonObject;

/**
 * `WhereQuery` comparands are the values in {@link WhereQueryComparisonObject|WhereQuery objects}.
 *
 * An `Operator` type param can be provided to narrow the type of comparand to a specific operator.
 * For example, `WhereQueryComparand<"eq">` will be a `string | number`.
 *
 * If not provided, this type will reflect a union of all possible comparand types.
 */
export type WhereQueryComparand<
  Operator extends WhereQueryOperator = WhereQueryOperator
> = Required<WhereQueryComparisonObject>[Operator]; // prettier-ignore
