/* eslint vitest/expect-expect: ["error", { "assertFunctionNames": ["expectTypeOf"] }] */
import { expectTypeOf } from "vitest";
import type { ItemTypeFromSchema } from "./ItemTypeFromSchema.js";

test("keeps attributes optional when no schema fields are required", () => {
  type Schema = {
    nickname: { type: "string" };
    settings: { type: "map"; schema: { enabled: { type: "boolean" } } };
  };
  expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{
    nickname?: string;
    settings?: { enabled?: boolean };
  }>();
});

test("preserves required aliases and makes defaulted fields optional on request", () => {
  type Schema = {
    pk: { type: "string"; required: true; alias: "id" };
    count: { type: "number"; required: true; default: 0 };
    label: { type: "string" };
  };
  expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{
    id: string;
    count: number;
    label?: string;
  }>();
  expectTypeOf<
    ItemTypeFromSchema<Schema, { aliasKeys: true; optionalIfDefault: true }>
  >().toEqualTypeOf<{ id: string; count?: number; label?: string }>();
});

test("allows omission when every required attribute has a default", () => {
  type Schema = { count: { type: "number"; required: true; default: 0 } };
  expectTypeOf<ItemTypeFromSchema<Schema, { optionalIfDefault: true }>>().toEqualTypeOf<{
    count?: number;
  }>();
});
