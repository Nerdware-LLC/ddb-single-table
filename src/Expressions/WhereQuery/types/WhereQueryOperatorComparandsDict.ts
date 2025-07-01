/**
 * An internal dictionary of `WhereQuery` operators mapped to their respective comparand types.
 *
 * > - Each operator maps to a valid DynamoDB `KeyConditionExpression` operator.
 * > - Between 1-2 of these objects are used to build a `KeyConditionExpression`.
 *
 * @internal
 */
export interface WhereQueryOperatorComparandsDict {
  /** Equals (`fooKey === x`) */
  eq: string | number;
  /** Less than (`fooKey < x`) */
  lt: string | number;
  /** Less than or equal to (`fooKey <= x`) */
  lte: string | number;
  /** Greater than (`fooKey > x`) */
  gt: string | number;
  /** Greater than or equal to (`fooKey >= x`) */
  gte: string | number;
  /** `fooKey BETWEEN x AND z` */
  between: [string, string] | [number, number];
  /** `begins_with( fooKey, "fooVal" )` */
  beginsWith: string;
}
