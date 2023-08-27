import type {
  DynamoDbItemType,
  OneOrMoreMaybePartialItems,
  AscertainTypeFromOneOrMoreMaybePartialItems,
} from "./itemTypes";
import type { ModelSchemaType } from "./schemaTypes";

/**
 * When `IOActionMethod`s are accessed via an {@link IOActionMethod} like
 * `processItemData.toDB`, the context arguments are provided by a wrapper
 * function, so this call signature only includes `item`.
 */
export type IOActionSetFn = (item: Record<string, unknown>) => Record<string, unknown>;

/**
 * Boolean flags for controlling the behavior of IO-Action methods as described below. The
 * default value for each flag is `true` for all methods with the exception of `updateItem`,
 * for which they all default to `false`. Some flags only apply to certain methods, and/or a
 * single `IODirection` (e.g., `shouldSetDefaults` only applies to `toDB`, and therefore only
 * applies to write methods).
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
 * This type defines the `processItemData` property of Model class instances.
 */
export type ProcessItemDataDict<
  Schema extends ModelSchemaType,
  ItemOutput extends Record<string, any>,
  ItemInput extends Record<string, any>
> = {
  toDB: <ItemArgs extends OneOrMoreMaybePartialItems<ItemInput>>(
    itemInput: ItemArgs,
    ioBehavioralOpts?: IOBehavioralOpts
  ) => AscertainTypeFromOneOrMoreMaybePartialItems<ItemArgs, ItemInput, DynamoDbItemType<Schema>>;
  fromDB: <ItemArgs extends OneOrMoreMaybePartialItems<DynamoDbItemType<Schema>>>(
    itemOutput: ItemArgs | Record<string, any> | Array<Record<string, any>>,
    ioBehavioralOpts?: IOBehavioralOpts
  ) => AscertainTypeFromOneOrMoreMaybePartialItems<ItemArgs, DynamoDbItemType<Schema>, ItemOutput>;
};
