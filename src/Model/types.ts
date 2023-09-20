import type { Simplify, ConditionalPick } from "type-fest";
import type { BatchRetryExponentialBackoffConfigs } from "../BatchRequests";
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
import type { WhereQueryParam, UpdateItemAutoGenUpdateExpressionParams } from "../Expressions";
import type { BaseItem, AttrAliasOrName } from "../types/itemTypes";
import type { TableKeysSchemaType, ModelSchemaType, AttributeDefault } from "../types/schemaTypes";

/** A map of attribute names to corresponding aliases, or vice versa. */
export type AttributesAliasesMap = Record<string, string>;

/**
 * This generic is used by the Model class to provide intellisense for the aliased key params
 * that methods like `getItem()` and `deleteItem()` accept as input.
 * @internal
 */
export type AliasedPrimaryKeys<Schema extends TableKeysSchemaType | ModelSchemaType> = Simplify<
  {
    // Required - filter out RangeKey if configured with a functional default
    -readonly [Key in keyof Schema as Schema[Key] extends
      | { isHashKey: true }
      | { isRangeKey: true; default?: undefined }
      ? AttrAliasOrName<Schema, Key>
      : never]-?: string;
  } & {
    // This map will set RangeKey to optional if configured with a functional default
    -readonly [Key in keyof Schema as Schema[Key] extends {
      isRangeKey: true;
      default: AttributeDefault;
    }
      ? AttrAliasOrName<Schema, Key>
      : never]+?: string;
  }
>;

/**
 * When `IOActionMethod`s are accessed via an {@link IOActionMethod} like `processItemData.toDB`,
 * the context arguments are provided by a wrapper function, so this call signature only includes
 * `item`.
 */
export type IOActionSetFn = (item: BaseItem) => BaseItem;

/**
 * Boolean flags for controlling the behavior of IO-Action methods as described below. The default
 * value for each flag is `true` for all methods with the exception of `updateItem`, for which they
 * all default to `false`. Some flags only apply to certain methods, and/or a single `IODirection`
 * (e.g., `shouldSetDefaults` only applies to `toDB`, and therefore only applies to write methods).
 *
 * - **`shouldSetDefaults`** — If `true`, any `default`s defined in the schema are applied.
 *
 * - **`shouldTransformItem`** — If `true`, the `transformItem.toDB` method will be called
 *   if one is defined in the `ModelSchemaOptions`.
 *
 * - **`shouldValidateItem`** — If `true`, the `validateItem` method will be called if one
 *   is defined in the `ModelSchemaOptions`.
 *
 * - **`shouldCheckRequired`** — If `true`, attributes marked `required` in the schema are
 *   checked to ensure the `item` contains a value for each that is not `null`/`undefined`.
 */
export interface IOBehavioralOpts {
  shouldSetDefaults?: boolean;
  shouldTransformItem?: boolean;
  shouldValidateItem?: boolean;
  shouldCheckRequired?: boolean;
}

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
 * - If the `IsBatchOperation` type param is `true`, adds {@link BatchRetryExponentialBackoffConfigs}
 *
 * @internal
 */
type ModifyClientParamForModel<T, IsBatchOperation extends boolean = false> = Simplify<
  IsBatchOperation extends false
    ? Omit<T, InternallyHandledDdbSdkParameters>
    : Omit<T, InternallyHandledDdbSdkParameters> & {
        exponentialBackoffConfigs?: BatchRetryExponentialBackoffConfigs;
      }
>;

// MODEL METHOD PARAM TYPES:

/**
 * Input parameters for the `model.getItem()` method which are passed to the underlying
 * `GetItem` SDK command.
 */
export type GetItemOpts = ModifyClientParamForModel<GetItemInput>;

/**
 * Input parameters for the `model.batchGetItems()` method which are passed to the underlying
 * `BatchGetItem` SDK command.
 *
 * The `model.batchGetItems()` method also supports {@link BatchRetryExponentialBackoffConfigs},
 * which can optionally be used to customize the retry-behavior of the batch-requests handler.
 */
export type BatchGetItemsOpts = ModifyClientParamForModel<BatchGetItemsInput, true>;

/**
 * Input parameters for the `model.createItem()` method which are passed to the underlying
 * `PutItem` SDK command.
 *
 * > Since the `model.createItem()` method uses a `ConditionExpression` to prevent overwriting
 *   existing items, this method does not support user-provided ConditionExpressions.
 */
export type CreateItemOpts = Omit<UpsertItemOpts, "ConditionExpression">;

/**
 * Input parameters for the `model.upsertItem()` method which are passed to the underlying
 * `PutItem` SDK command.
 */
export type UpsertItemOpts = ModifyClientParamForModel<PutItemInput>;

/**
 * Input parameters for the `model.updateItem()` method which are passed to the underlying
 * `UpdateItem` SDK command.
 *
 * ### Auto-Generation of UpdateExpression
 *
 * The `model.updateItem()` method also supports the following
 * {@link UpdateItemAutoGenUpdateExpressionParams | parameters which can be used to auto-generate the `UpdateExpression` }:
 *
 * - `update` — The item attributes to be updated.
 * - `updateOptions` — Optional params for the `generateUpdateExpression` function.
 */
export type UpdateItemOpts<ItemInput extends BaseItem> = ModifyClientParamForModel<
  UpdateItemInput & UpdateItemAutoGenUpdateExpressionParams<ItemInput>
>;

/**
 * Input parameters for the `model.deleteItem()` method which are passed to the underlying
 * `DeleteItem` SDK command.
 */
export type DeleteItemOpts = ModifyClientParamForModel<DeleteItemInput>;

/**
 * Input parameters which are passed to the underlying `BatchWriteItem` SDK command.
 */
export type BatchWriteItemsOpts = ModifyClientParamForModel<BatchWriteItemsInput, true>;

/**
 * Input parameters for the `model.query()` method which are passed to the underlying
 * `Query` SDK command.
 *
 * ### Auto-Generation of KeyConditionExpression
 *
 * The `model.query()` method also supports {@link WhereQueryParam | `WhereQuery` syntax } which can
 * be used to auto-generate the `KeyConditionExpression`.
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
export type QueryOpts<ItemType extends BaseItem = BaseItem> = ModifyClientParamForModel<
  QueryInput &
    Partial<WhereQueryParam<ItemType>> & {
      limit?: QueryInput["Limit"];
    }
>;

/**
 * Input parameters for the `model.scan()` method which are passed to the underlying
 * `Scan` SDK command.
 */
export type ScanOpts = ModifyClientParamForModel<ScanInput>;
