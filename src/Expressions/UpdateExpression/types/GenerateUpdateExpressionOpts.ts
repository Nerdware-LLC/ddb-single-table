/**
 * Parameters for `generateUpdateExpression`.
 */
export interface GenerateUpdateExpressionOpts {
  /**
   * Defines the `UpdateExpression` clause to which `null` values are added:
   * - `"REMOVE"`: `null` values will be added to the `REMOVE` clause (default).
   *   - _On `null`, attributes are removed from the db_
   * - `"SET"`: `null` values will be added to the `SET` clause.
   *   - _On `null`, attribute values are set to `null` in the db_
   */
  nullHandling?: "SET" | "REMOVE";
}
