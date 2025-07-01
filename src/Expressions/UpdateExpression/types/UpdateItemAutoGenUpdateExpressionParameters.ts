import type { GenerateUpdateExpressionOpts } from "./GenerateUpdateExpressionOpts.js";
import type { UnknownItem } from "../../../types/index.js";

/**
 * Input parameters for the `updateItem()` method which are used to auto-generate the
 * following `UpdateItem` arguments:
 *
 * - `UpdateExpression` (may include `"SET"` and/or `"REMOVE"` clauses)
 * - `ExpressionAttributeNames`
 * - `ExpressionAttributeValues`
 */
export type UpdateItemAutoGenUpdateExpressionParameters<ItemUpdateParams extends UnknownItem> = {
  /** The item attributes to be updated. */
  update: ItemUpdateParams;
  /** Optional params for the `generateUpdateExpression` function. */
  updateOptions?: GenerateUpdateExpressionOpts;
};
