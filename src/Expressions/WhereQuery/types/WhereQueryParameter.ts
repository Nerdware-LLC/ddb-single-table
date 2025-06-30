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
