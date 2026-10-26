import type { ItemWhereQuery } from "./ItemWhereQuery.js";
import type { BaseItem, UnknownItem } from "../../../types/index.js";

/**
 * The `WhereQuery` parameter for `convertWhereQueryToSdkQueryArgs`.
 */
export type WhereQueryParameter<ItemParams extends UnknownItem = BaseItem> = {
  /**
   * `WhereQuery` is a flexible, dev-friendly syntax used to build `QueryCommand` args:
   * - `KeyConditionExpression`
   * - `ExpressionAttributeNames`
   * - `ExpressionAttributeValues`
   *
   * In `model.query()`, `model.queryPage()`, and `model.queryItems()`, automatic index
   * selection relies on key-insertion order: partition (hash) key first, then optional
   * sort (range) key, including when using aliases. If supplying the sort key first
   * (e.g. `{ sk: "whatever", pk: "foo" }`), you MUST supply `IndexName` explicitly
   * for the intended secondary index. For the base table, put its partition key first.
   *
   * ```ts
   * // The `where` argument in this query contains 2 WhereQueryComparisonObjects:
   * const queryResults = await PersonModel.query({
   *   where: {
   *     name: { eq: "Foo" }, // "name = Foo"
   *     age: {
   *       between: [ 15, 30 ] // "age BETWEEN 15 AND 30"
   *     },
   *   }
   * });
   * ```
   */
  where?: ItemWhereQuery<ItemParams>;
};
