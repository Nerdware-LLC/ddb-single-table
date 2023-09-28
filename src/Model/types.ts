import type { Simplify } from "type-fest";
import type { BatchOperationParams } from "../BatchRequests";
import type {
  GetItemInput,
  BatchGetItemsInput,
  PutItemInput,
  UpdateItemInput,
  DeleteItemInput,
  BatchWriteItemsInput,
  QueryInput,
  ScanInput,
} from "../DdbClientWrapper";
import type { WhereQueryParams, UpdateItemAutoGenUpdateExpressionParams } from "../Expressions";
import type { TableKeysSchemaType, ModelSchemaType, AttributeDefault } from "../Schema";
import type { BaseItem, AttrAliasOrName } from "../types/itemTypes";

/** A map of attribute names to corresponding aliases, or vice versa. */
export type AttributesAliasesMap = Record<string, string>;

/**
 * This generic is used by the Model class to provide intellisense for the aliased key params
 * that methods like `getItem()` and `deleteItem()` accept as input.
 * @internal
 */
export type KeyParameters<Schema extends TableKeysSchemaType | ModelSchemaType> = Simplify<
  {
    // Required - filter out RangeKey if configured with a functional default
    -readonly [Key in keyof Schema as Schema[Key] extends
      | { isHashKey: true }
      | { isRangeKey: true; default?: undefined }
      ? AttrAliasOrName<Schema, Key, { aliasKeys: true }>
      : never]-?: string | number;
  } & {
    // This map will set RangeKey to optional if configured with a functional default
    -readonly [Key in keyof Schema as Schema[Key] extends {
      isRangeKey: true;
      default: AttributeDefault;
    }
      ? AttrAliasOrName<Schema, Key, { aliasKeys: true }>
      : never]+?: string | number;
  }
>;

/**
 * A union of SDK command parameter names which are provided automatically by Model methods,
 * and are therefore omitted from the method parameter typings.
 * @internal
 */
type InternallyHandledDdbSdkParameters =
  | "TableName" //            Handled by Model methods
  | "Key" //                  Handled by Model methods
  | "Item" //                 Handled by Model methods
  | "RequestItems"; //        Handled by Model methods

/**
 * This internal generic util takes a DdbClientWrapper input type `<T>` and applies the following
 * modifications to it:
 *
 * - Removes all {@link InternallyHandledDdbSdkParameters | parameters which are provided by Model methods }
 * - Adds any additional parameters provided by the `AdditionalParams` type param.
 *
 * @internal
 */
type ModifyClientParamsForModel<
  T,
  AdditionalParams extends Record<string, unknown> | undefined = undefined,
> = Simplify<
  AdditionalParams extends Record<string, unknown>
    ? Omit<T, InternallyHandledDdbSdkParameters> & AdditionalParams
    : Omit<T, InternallyHandledDdbSdkParameters>
>;

// MODEL METHOD PARAM TYPES:

/** `model.getItem()` parameters which are passed to the underlying `GetItem` SDK command. */
export type GetItemOpts = ModifyClientParamsForModel<GetItemInput>;

/**
 * `model.batchGetItems()` parameters which are passed to the underlying `BatchGetItem` SDK command.
 *
 * The `model.batchGetItems()` method also supports {@link BatchOperationParams | batch-request parameters },
 * which can optionally be used to customize the retry-behavior of the batch-requests handler.
 */
export type BatchGetItemsOpts = ModifyClientParamsForModel<
  BatchGetItemsInput,
  BatchOperationParams
>;

/**
 * `model.createItem()` parameters which are passed to the underlying `PutItem` SDK command.
 *
 * > Since the `model.createItem()` method uses a `ConditionExpression` to prevent overwriting
 *   existing items, this method does not support user-provided ConditionExpressions.
 */
export type CreateItemOpts = Omit<UpsertItemOpts, "ConditionExpression">;

/** `model.upsertItem()` parameters which are passed to the underlying `PutItem` SDK command. */
export type UpsertItemOpts = ModifyClientParamsForModel<PutItemInput>;

/**
 * `model.updateItem()` parameters which are passed to the underlying `UpdateItem` SDK command.
 *
 * ### Auto-Generation of UpdateExpression
 *
 * The `model.updateItem()` method also supports the following
 * {@link UpdateItemAutoGenUpdateExpressionParams | parameters which can be used to auto-generate the `UpdateExpression` }:
 *
 * - `update` — The item attributes to be updated.
 * - `updateOptions` — Optional params for the `generateUpdateExpression` function.
 */
export type UpdateItemOpts<ItemParams extends BaseItem> = ModifyClientParamsForModel<
  UpdateItemInput,
  UpdateItemAutoGenUpdateExpressionParams<ItemParams>
>;

/** `model.deleteItem()` parameters which are passed to the underlying `DeleteItem` SDK command. */
export type DeleteItemOpts = ModifyClientParamsForModel<DeleteItemInput>;

/** Model method parameters which are passed to the underlying `BatchWriteItem` SDK command. */
export type BatchWriteItemsOpts = ModifyClientParamsForModel<
  BatchWriteItemsInput,
  BatchOperationParams
>;

/**
 * `model.query()` parameters which are passed to the underlying `Query` SDK command.
 *
 * ### Auto-Generation of KeyConditionExpression
 *
 * The `model.query()` method also supports {@link WhereQueryParams | `WhereQuery` syntax } which
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
export type QueryOpts<ItemParams extends Record<string, unknown>> = ModifyClientParamsForModel<
  QueryInput,
  WhereQueryParams<ItemParams> & {
    limit?: QueryInput["Limit"];
  }
>;

/** `model.scan()` parameters which are passed to the underlying `Scan` SDK command. */
export type ScanOpts = ModifyClientParamsForModel<ScanInput>;
