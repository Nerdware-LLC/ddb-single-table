import type { BaseItem, ItemParameters } from "../../types/itemTypes";

/**
 * Option parameters for `generateUpdateExpression`.
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

/**
 * Input parameters for the `updateItem()` method which can be used to auto-generate the
 * following `UpdateItem` arguments:
 *
 * - `UpdateExpression` (may include `"SET"` and/or `"REMOVE"` clauses)
 * - `ExpressionAttributeNames`
 * - `ExpressionAttributeValues`
 */
export type UpdateItemAutoGenUpdateExpressionParams<ItemInputType extends BaseItem = BaseItem> = {
  /** The item attributes to be updated. */
  update?: ItemParameters<ItemInputType>;
  /** Optional params for the `generateUpdateExpression` function. */
  updateOptions?: GenerateUpdateExpressionOpts;
};
