import type { BaseItem } from "./BaseItem.js";
import type { IterateNestDepthMax32, NestDepthMax32 } from "./NestDepth.js";
import type { Simplify } from "type-fest";

/**
 * This generic creates a typing for the parameters necessary to update an Item.
 */
export type ItemUpdateParameters<ItemCreationParams extends BaseItem> = Simplify<
  ItemParametersValue<ItemCreationParams, 0>
>;

/**
 * This generic creates a typing for the parameters necessary to update an Item.
 */
type ItemParametersValue<T, NestDepth extends NestDepthMax32> =
  IterateNestDepthMax32<NestDepth> extends 32
    ? never
    : T extends BaseItem
      ? { [K in keyof T]+?: ItemParametersValue<T[K], IterateNestDepthMax32<NestDepth>> }
      : T extends Array<infer El>
        ? Array<ItemParametersValue<El, IterateNestDepthMax32<NestDepth>>>
        : T;
