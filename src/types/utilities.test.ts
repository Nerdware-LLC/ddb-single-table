import { expectTypeOf } from "vitest";
import type {
  AttrAliasOrName,
  BaseItem,
  FixPartialUndefined,
  ItemKeys,
  ItemTypeOpts,
  NativeAttributeValue,
  NativeKeyAttributeValue,
  OverrideSharedProperties,
  SupportedAttributeValueType,
  TimestampAttributes,
  UnknownItem,
} from "./index.js";
import type { NativeAttributeBinary, NumberValue } from "@aws-sdk/util-dynamodb";
import type { IsAny } from "type-fest";

describe("AttrAliasOrName", () => {
  type Schema = {
    pk: { type: "string"; alias: "id" };
    count: { type: "number" };
    broadAlias: { type: "string"; alias?: string };
  };

  test("uses an alias only when aliasKeys is explicitly true", () => {
    expectTypeOf<AttrAliasOrName<Schema, "pk", { aliasKeys: true }>>().toEqualTypeOf<"id">();
    expectTypeOf<AttrAliasOrName<Schema, "pk", { aliasKeys: false }>>().toEqualTypeOf<"pk">();
    expectTypeOf<AttrAliasOrName<Schema, "pk", Record<never, never>>>().toEqualTypeOf<"pk">();
    expectTypeOf<AttrAliasOrName<Schema, "pk", { aliasKeys: boolean }>>().toEqualTypeOf<"pk">();
  });

  test("falls back to the name when no definite alias exists", () => {
    expectTypeOf<AttrAliasOrName<Schema, "count", { aliasKeys: true }>>().toEqualTypeOf<"count">();
    expectTypeOf<
      AttrAliasOrName<Schema, "broadAlias", { aliasKeys: true }>
    >().toEqualTypeOf<"broadAlias">();
  });
});

describe("FixPartialUndefined", () => {
  test("removes undefined from required fields and explicitly permits it in optional fields", () => {
    type Fixed = FixPartialUndefined<{
      required: string | undefined;
      nullable: number | null | undefined;
      optional?: boolean;
      optionalNullable?: Date | null | undefined;
    }>;

    expectTypeOf<Fixed>().toEqualTypeOf<{
      required: string;
      nullable: number | null;
      optional?: boolean | undefined;
      optionalNullable?: Date | null | undefined;
    }>();
    expectTypeOf<{ required: string; nullable: null; optional: undefined }>().toExtend<Fixed>();
    expectTypeOf<{ required: undefined; nullable: number }>().not.toExtend<Fixed>();
    expectTypeOf<{ nullable: number }>().not.toExtend<Fixed>();
  });

  test("normalizes property modifiers without recursively changing nested objects", () => {
    expectTypeOf<
      FixPartialUndefined<{
        readonly id: string | undefined;
        nested: { value: string | undefined };
      }>
    >().toEqualTypeOf<{
      id: string;
      nested: { value: string | undefined };
    }>();
    expectTypeOf<FixPartialUndefined<Record<never, never>>>().toEqualTypeOf<Record<never, never>>();
    expectTypeOf<FixPartialUndefined<{ value: undefined }>>().toEqualTypeOf<{ value: never }>();
  });
});

describe("OverrideSharedProperties", () => {
  test("overrides shared property types and ignores extra override keys", () => {
    expectTypeOf<
      OverrideSharedProperties<{ id: string; count: number }, { count: string; extra: boolean }>
    >().toEqualTypeOf<{ id: string; count: string }>();
  });

  test("preserves the base property modifiers regardless of override modifiers", () => {
    expectTypeOf<
      OverrideSharedProperties<
        { readonly id: string; count?: number; required: number },
        { id: number; count: string; required?: boolean }
      >
    >().toEqualTypeOf<{ readonly id: number; count?: string; required: boolean | undefined }>();
  });

  test("handles empty and disjoint overrides", () => {
    expectTypeOf<OverrideSharedProperties<{ id: string }, Record<never, never>>>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<OverrideSharedProperties<{ id: string }, { other: number }>>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<OverrideSharedProperties<Record<never, never>, { id: string }>>().toEqualTypeOf<
      Record<never, never>
    >();
  });
});

describe("NativeAttributeValue and NativeKeyAttributeValue", () => {
  test("accepts native DynamoDB scalars, recursive containers, and sets", () => {
    expectTypeOf<
      string | number | boolean | bigint | null | undefined | NumberValue | NativeAttributeBinary
    >().toExtend<NativeAttributeValue>();
    expectTypeOf<{
      nested: { list: Array<string | number | null> };
    }>().toExtend<NativeAttributeValue>();
    expectTypeOf<
      Set<string | number | bigint | NumberValue | NativeAttributeBinary | undefined>
    >().toExtend<NativeAttributeValue>();
    expectTypeOf<IsAny<NativeAttributeValue>>().toEqualTypeOf<false>();
  });

  test("rejects class instances, functions, and unsupported set elements", () => {
    expectTypeOf<Date>().not.toExtend<NativeAttributeValue>();
    expectTypeOf<() => string>().not.toExtend<NativeAttributeValue>();
    expectTypeOf<symbol>().not.toExtend<NativeAttributeValue>();
    expectTypeOf<Set<boolean>>().not.toExtend<NativeAttributeValue>();
    expectTypeOf<Set<{ id: string }>>().not.toExtend<NativeAttributeValue>();
  });

  test("restricts keys to string, number, and binary values", () => {
    expectTypeOf<NativeKeyAttributeValue>().toEqualTypeOf<
      string | number | bigint | NumberValue | NativeAttributeBinary
    >();
    expectTypeOf<boolean | null | undefined>().not.toExtend<NativeKeyAttributeValue>();
    expectTypeOf<Date>().not.toExtend<NativeKeyAttributeValue>();
    expectTypeOf<string[]>().not.toExtend<NativeKeyAttributeValue>();
    expectTypeOf<{ id: string }>().not.toExtend<NativeKeyAttributeValue>();
    expectTypeOf<Set<string>>().not.toExtend<NativeKeyAttributeValue>();
  });
});

describe("SupportedAttributeValueType and item containers", () => {
  test("adds dates and readonly recursive arrays to native DynamoDB values", () => {
    expectTypeOf<NativeAttributeValue>().toExtend<SupportedAttributeValueType>();
    expectTypeOf<Date>().toExtend<SupportedAttributeValueType>();
    expectTypeOf<
      readonly [Date, { nested: readonly Date[] }]
    >().toExtend<SupportedAttributeValueType>();
    expectTypeOf<IsAny<SupportedAttributeValueType>>().toEqualTypeOf<false>();
    expectTypeOf<() => string>().not.toExtend<SupportedAttributeValueType>();
    expectTypeOf<symbol>().not.toExtend<SupportedAttributeValueType>();
  });

  test("allows supported values in BaseItem and only native key values in ItemKeys", () => {
    expectTypeOf<{
      id: string;
      date: Date;
      nested: { values: readonly Date[] };
    }>().toExtend<BaseItem>();
    expectTypeOf<{ invalid: () => string }>().not.toExtend<BaseItem>();
    expectTypeOf<{ pk: string; sk: number; binary: Buffer }>().toExtend<ItemKeys>();
    expectTypeOf<{ pk: boolean }>().not.toExtend<ItemKeys>();
    expectTypeOf<{ pk: null }>().not.toExtend<ItemKeys>();
    expectTypeOf<{ pk: undefined }>().not.toExtend<ItemKeys>();
    expectTypeOf<{ pk: Date }>().not.toExtend<ItemKeys>();
    expectTypeOf<BaseItem[string]>().toEqualTypeOf<SupportedAttributeValueType>();
    expectTypeOf<ItemKeys[string]>().toEqualTypeOf<NativeKeyAttributeValue>();
  });

  test("permits arbitrary unknown values in UnknownItem without widening to any", () => {
    expectTypeOf<{
      value: unknown;
      callback: () => void;
      symbol: symbol;
    }>().toExtend<UnknownItem>();
    expectTypeOf<UnknownItem[string]>().toBeUnknown();
    expectTypeOf<UnknownItem>().not.toExtend<BaseItem>();
  });
});

describe("ItemTypeOpts and TimestampAttributes", () => {
  test("exposes five optional boolean options", () => {
    expectTypeOf<ItemTypeOpts>().toEqualTypeOf<{
      aliasKeys?: boolean;
      optionalIfDefault?: boolean;
      nullableIfOptional?: boolean;
      autoAddTimestamps?: boolean;
      convertDatesToStrings?: boolean;
    }>();
    expectTypeOf<Record<never, never>>().toExtend<ItemTypeOpts>();
    expectTypeOf<{ aliasKeys: string }>().not.toExtend<ItemTypeOpts>();
  });

  test("requires createdAt and updatedAt dates", () => {
    expectTypeOf<TimestampAttributes>().toEqualTypeOf<{ createdAt: Date; updatedAt: Date }>();
    expectTypeOf<{ createdAt: Date }>().not.toExtend<TimestampAttributes>();
    expectTypeOf<{ createdAt: string; updatedAt: string }>().not.toExtend<TimestampAttributes>();
  });
});
