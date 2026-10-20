import { expectTypeOf } from "vitest";
import type { ItemTypeToSchema } from "./ItemTypeToSchema.js";
import type { ItemTypeFromSchema } from "./index.js";

describe("ItemTypeToSchema", () => {
  test("maps primitive values to required, non-nullable attribute configs", () => {
    type Schema = ItemTypeToSchema<{
      text: string;
      count: number;
      enabled: boolean;
      date: Date;
      binary: Buffer;
    }>;

    expectTypeOf<Schema["text"]["type"]>().toEqualTypeOf<"string">();
    expectTypeOf<Schema["count"]["type"]>().toEqualTypeOf<"number">();
    expectTypeOf<Schema["enabled"]["type"]>().toEqualTypeOf<"boolean">();
    expectTypeOf<Schema["date"]["type"]>().toEqualTypeOf<"Date">();
    expectTypeOf<Schema["binary"]["type"]>().toEqualTypeOf<"Buffer">();
    expectTypeOf<Schema["text"]["required"]>().toEqualTypeOf<true>();
    expectTypeOf<Schema["text"]["nullable"]>().toEqualTypeOf<false | undefined>();
    expectTypeOf<Schema>().toExtend<{
      readonly text: {
        readonly type: "string";
        readonly required: true;
        readonly nullable?: false;
      };
    }>();
  });

  test("infers optionality and nullability independently", () => {
    type Schema = ItemTypeToSchema<{
      optional?: string;
      nullable: number | null;
      both?: boolean | null;
      undefinedUnion: string | undefined;
    }>;

    expectTypeOf<Schema["optional"]["required"]>().toEqualTypeOf<false | undefined>();
    expectTypeOf<Schema["optional"]["nullable"]>().toEqualTypeOf<false | undefined>();
    expectTypeOf<Schema["nullable"]["required"]>().toEqualTypeOf<true>();
    expectTypeOf<Schema["nullable"]["nullable"]>().toEqualTypeOf<true>();
    expectTypeOf<Schema["both"]["required"]>().toEqualTypeOf<false | undefined>();
    expectTypeOf<Schema["both"]["nullable"]>().toEqualTypeOf<true>();
    expectTypeOf<Schema["undefinedUnion"]["required"]>().toEqualTypeOf<false | undefined>();
    expectTypeOf<Pick<Schema, "optional">>().not.toExtend<{ optional?: never }>();
  });

  test("infers literal strings as enums without depending on union ordering", () => {
    type Schema = ItemTypeToSchema<{ status: "OPEN" | "CLOSED"; single: "ONLY" }>;

    expectTypeOf<Schema["status"]["type"]>().toEqualTypeOf<"enum">();
    expectTypeOf<Schema["status"]["oneOf"][number]>().toEqualTypeOf<"OPEN" | "CLOSED">();
    expectTypeOf<Schema["single"]["oneOf"]>().toEqualTypeOf<["ONLY"]>();
  });

  test("maps nested maps, arrays, and tuples recursively", () => {
    type Schema = ItemTypeToSchema<{
      profile: { name: string; age?: number };
      dates: Date[];
      records: Array<{ id: string; deleted: boolean | null }>;
      tuple: [string, number];
    }>;

    expectTypeOf<Schema["profile"]["type"]>().toEqualTypeOf<"map">();
    expectTypeOf<Schema["profile"]["schema"]["name"]["type"]>().toEqualTypeOf<"string">();
    expectTypeOf<Schema["profile"]["schema"]["age"]["required"]>().toEqualTypeOf<
      false | undefined
    >();
    expectTypeOf<Schema["dates"]["type"]>().toEqualTypeOf<"array">();
    expectTypeOf<Schema["dates"]["schema"][0]["type"]>().toEqualTypeOf<"Date">();
    expectTypeOf<Schema["records"]["schema"][0]["type"]>().toEqualTypeOf<"map">();
    expectTypeOf<
      Schema["records"]["schema"][0]["schema"]["deleted"]["nullable"]
    >().toEqualTypeOf<true>();
    expectTypeOf<Schema["tuple"]["type"]>().toEqualTypeOf<"tuple">();
    expectTypeOf<Schema["tuple"]["schema"][0]["type"]>().toEqualTypeOf<"string">();
    expectTypeOf<Schema["tuple"]["schema"][1]["type"]>().toEqualTypeOf<"number">();
  });

  test("rejects any, never, and unsupported values instead of inferring broad schemas", () => {
    expectTypeOf<ItemTypeToSchema<{ value: any }>["value"]>().toBeNever();
    expectTypeOf<ItemTypeToSchema<{ value: never }>["value"]>().toBeNever();
    expectTypeOf<ItemTypeToSchema<{ value: undefined }>["value"]>().toBeNever();
    expectTypeOf<ItemTypeToSchema<{ value: null }>["value"]>().toBeNever();
    expectTypeOf<ItemTypeToSchema<{ value: bigint }>["value"]>().toBeNever();
    // @ts-expect-error Unknown values do not satisfy the BaseItem constraint.
    type UnknownSchema = ItemTypeToSchema<{ value: unknown }>;
    expectTypeOf<UnknownSchema["value"]>().toBeNever();
  });

  test("accepts a concrete schema that recovers the original item type", () => {
    type Item = { id: string; status: "OPEN"; profile?: { age: number | null } };
    const _schema = {
      id: { type: "string", required: true },
      status: { type: "enum", oneOf: ["OPEN"], required: true },
      profile: {
        type: "map",
        schema: { age: { type: "number", required: true, nullable: true } },
      },
    } as const satisfies ItemTypeToSchema<Item>;

    expectTypeOf<ItemTypeFromSchema<typeof _schema>>().toEqualTypeOf<Item>();
  });

  test("accepts a multi-value oneOf config for an item with a string literal union", () => {
    type Schema = ItemTypeToSchema<{ status: "OPEN" | "CLOSED" }>;

    type EnumConfig = { type: "enum"; oneOf: ["OPEN", "CLOSED"]; required: true };

    expectTypeOf<EnumConfig>().toExtend<Schema["status"]>();
  });
});
