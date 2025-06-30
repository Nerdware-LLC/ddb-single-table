import type {
  ClientWrapperGetItemInput,
  ClientWrapperBatchGetItemInput,
  ClientWrapperPutItemInput,
  ClientWrapperUpdateItemInput,
  ClientWrapperDeleteItemInput,
  ClientWrapperBatchWriteItemInput,
  ClientWrapperQueryInput,
  ClientWrapperScanInput,
} from "../../DdbClientWrapper/types/index.js";
import type {
  WhereQueryParameter,
  UpdateItemAutoGenUpdateExpressionParameters,
} from "../../Expressions/index.js";
import type { UnknownItem, FixPartialUndefined } from "../../types/index.js";
import type { Except } from "type-fest";

/**
 * Union of SDK command-parameter names which are internally handled by `Model`
 * methods and are therefore omitted from method parameter typings.
 *
 * **NOTES:**
 *
 * - `ReturnValues` - Providing a custom ReturnValues arg to a Model method will often (but not
 *   _always_) change the attributes present in the returned object. Therefore, every Model method
 *   which uses a DDB operation which supports this param would require a generic return type to
 *   properly support this. If there's sufficient demand for this feature, it can be targeted for a
 *   future release, but considering users have direct access to the underlying DDB operations via
 *   the `DdbClientWrapper`, the Model class will not support custom `ReturnValues` at this time.
 */
type SdkCommandParametersInternallyHandledByModel =
  | "Key"
  | "Item"
  | "RequestItems"
  | "ReturnValues";

/**
 * This internal generic util takes a `DdbClientWrapper` input type `<T>` and
 * applies the following modifications to derive `Model` method param types:
 *
 * - Removes all {@link SdkCommandParametersInternallyHandledByModel|parameters handled by Model methods}.
 */
type ModifyClientParamsForModel<T> = FixPartialUndefined<
  Omit<T, SdkCommandParametersInternallyHandledByModel>
>;

///////////////////////////////////////////////////////////////////////////////////////////////////
// MODEL METHOD PARAM TYPES:

/**
 * `model.getItem()` parameters which are passed to the underlying `GetItem` SDK command.
 */
export type GetItemOpts = ModifyClientParamsForModel<ClientWrapperGetItemInput>;

/**
 * `model.batchGetItems()` parameters which are passed to the underlying `BatchGetItem` SDK
 * command. The `model.batchGetItems()` method also supports batch-request parameters, which
 * can optionally be used to customize the retry-behavior of the batch-requests handler.
 */
export type BatchGetItemsOpts = ModifyClientParamsForModel<ClientWrapperBatchGetItemInput>;

/**
 * `model.createItem()` parameters which are passed to the underlying `PutItem` SDK command.
 *
 * > Since the `model.createItem()` method uses a `ConditionExpression` to prevent overwriting
 *   existing items, this method does not support user-provided ConditionExpressions.
 */
export type CreateItemOpts = ModifyClientParamsForModel<
  Except<
    UpsertItemOpts,
    "ConditionExpression" | "ExpressionAttributeNames" | "ExpressionAttributeValues"
    // The ommission of ConditionExpression makes EAN/EAV unneccessary
  >
>;

/**
 * `model.upsertItem()` parameters which are passed to the underlying `PutItem` SDK command.
 */
export type UpsertItemOpts = ModifyClientParamsForModel<ClientWrapperPutItemInput>;

/**
 * `model.updateItem()` parameters which are passed to the underlying `UpdateItem` SDK command.
 *
 * ### Auto-Generation of UpdateExpression
 *
 * The `model.updateItem()` method uses the `update` parameter to auto-generate arguments for the
 * underlying `UpdateItem` operation — specifically `UpdateExpression`, `ExpressionAttributeNames`,
 * and `ExpressionAttributeValues`.
 *
 * - `update` — The item attributes to be updated.
 * - `updateOptions` — {@link UpdateItemAutoGenUpdateExpressionParameters|Optional params} for the
 *   `generateUpdateExpression` function.
 */
export type UpdateItemOpts<ItemParams extends UnknownItem> = ModifyClientParamsForModel<
  Except<
    ClientWrapperUpdateItemInput,
    "UpdateExpression" | "ExpressionAttributeNames" | "ExpressionAttributeValues"
  >
    & UpdateItemAutoGenUpdateExpressionParameters<ItemParams>
>;

/**
 * `model.deleteItem()` parameters which are passed to the underlying `DeleteItem` SDK command.
 */
export type DeleteItemOpts = ModifyClientParamsForModel<ClientWrapperDeleteItemInput>;

/**
 * Model method parameters which are passed to the underlying `BatchWriteItem` SDK command.
 */
export type BatchWriteItemsOpts = ModifyClientParamsForModel<ClientWrapperBatchWriteItemInput>;

/**
 * `model.query()` parameters which are passed to the underlying `Query` SDK command.
 *
 * ### Auto-Generation of KeyConditionExpression
 *
 * The `model.query()` method also supports {@link WhereQueryParameter|`WhereQuery` syntax} which
 * can be used to auto-generate the `KeyConditionExpression`.
 *
 * @example
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
export type QueryOpts<ItemParams extends UnknownItem> = ModifyClientParamsForModel<
  WhereQueryParameter<ItemParams> & {
    limit?: ClientWrapperQueryInput["Limit"];
  } & ClientWrapperQueryInput
>;

/**
 * `model.scan()` parameters which are passed to the underlying `Scan` SDK command.
 */
export type ScanOpts = ModifyClientParamsForModel<ClientWrapperScanInput>;
