import type { BaseItem } from "./BaseItem.js";
import type { NativeAttributeValue } from "./NativeAttributeValue.js";
import type { NestDepthMax32, IterateNestDepthMax32 } from "./NestDepth.js";
import type { AnyValidAttributeConfig, ModelSchemaAttributeConfig } from "../Schema/types/index.js";
import type { Simplify, Except, IsAny, IsUnknown, IsNever, IsTuple, UnionToTuple } from "type-fest";

/**
 * This generic creates a `Schema` type from the provided item-type `T`, the
 * keys of which _**must**_ reflect attribute names — not aliases.
 */
export type ItemTypeToSchema<T extends BaseItem> = MapItemToSchema<T, 0>;

/**
 * Maps the item-type `T` to a `Schema` type with corresponding attribute-configs.
 */
type MapItemToSchema<T extends BaseItem, NestDepth extends NestDepthMax32> = {
  readonly [Key in keyof T]-?: ItemValueToAttrConfig<T[Key], NestDepth>;
};

/**
 * Returns the attribute-config types for the given `Value`.
 */
type ItemValueToAttrConfig<Value, NestDepth extends NestDepthMax32> =
  CanAscertainValueSchemaType<Value> extends false
    ? never
    : Simplify<
        Except<
          NestDepth extends 0 ? AnyValidAttributeConfig : ModelSchemaAttributeConfig,
          "type" | "oneOf" | "schema" | "required" | "nullable"
        >
          & TypeAttrConfigForValue<NonNullable<Value>, NestDepth>
          & RequiredAttrConfigForValue<Value>
          & NullableAttrConfigForValue<Value>
      >;

/**
 * Returns the `type`, `oneOf`, and `schema` attribute-config types for the given `Value`.
 */
// prettier-ignore
type TypeAttrConfigForValue<
  Value extends NonNullable<NativeAttributeValue>,
  NestDepth extends NestDepthMax32,
> =
  Value extends string
    ? string extends Value
      ? { readonly type: "string" }
      : { readonly type: "enum"; readonly oneOf: UnionToTuple<Value> }
  : Value extends number
    ? { readonly type: "number" }
  : Value extends boolean
    ? { readonly type: "boolean" }
  : Value extends Date
    ? { readonly type: "Date" }
  : Value extends Buffer
    ? { readonly type: "Buffer" }
  : NestDepth extends 32
    ? never // <-- Only nested types remain, so ensure NestDepth is not already maxed out.
  : Value extends Array<infer El>
    ? {
        readonly type: IsTuple<Value> extends true ? "tuple" : "array";
        readonly schema: [ItemValueToAttrConfig<El, IterateNestDepthMax32<NestDepth>>];
      }
  : Value extends BaseItem
    ? {
        readonly type: "map";
        readonly schema: MapItemToSchema<Value, IterateNestDepthMax32<NestDepth>>;
      }
  : never;

/**
 * Returns the `required` attribute-config type for the given `Value`.
 */
type RequiredAttrConfigForValue<Value> = undefined extends Value
  ? { readonly required?: false }
  : { readonly required: true };

/**
 * Returns the `nullable` attribute-config type for the given `Value`.
 */
type NullableAttrConfigForValue<Value> = null extends Value
  ? { readonly nullable: true }
  : { readonly nullable?: false };

/**
 * A value's `Schema` cannot be ascertained if it is `any`, `unknown`, or `never`.
 * This generic returns `false` if the type is one of those, and `true` otherwise.
 */
// prettier-ignore
type CanAscertainValueSchemaType<T> =
  IsAny<T> extends true
    ? false
  : IsUnknown<T> extends true
    ? false
  : IsNever<T> extends true
    ? false
  : true;
