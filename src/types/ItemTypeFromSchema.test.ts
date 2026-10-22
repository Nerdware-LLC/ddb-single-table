import { expectTypeOf } from "vitest";
import type { AttrValue, ItemTypeFromSchema } from "./index.js";
import type { ModelSchemaType } from "../Schema/types/index.js";

// Build schemas independently of the implementation's depth iterator.
type NestedArraySchema<
  Depth extends number,
  Levels extends unknown[] = [],
> = Levels["length"] extends Depth
  ? { type: "string" }
  : { type: "array"; schema: readonly [NestedArraySchema<Depth, [...Levels, unknown]>] };

type ArrayLeaf<T> = T extends Array<infer Element> ? ArrayLeaf<Element> : T;

// These assertions are checked by `npm run typecheck` (also run by CI's lint step).
// Vitest alone transpiles TypeScript and does not validate type assertions.
describe("ItemTypeFromSchema", () => {
  test("maps all scalar types and preserves enum literals", () => {
    type Item = ItemTypeFromSchema<{
      text: { type: "string"; required: true };
      count: { type: "number"; required: true };
      enabled: { type: "boolean"; required: true };
      binary: { type: "Buffer"; required: true };
      date: { type: "Date"; required: true };
      status: { type: "enum"; oneOf: readonly ["OPEN", "CLOSED"]; required: true };
    }>;

    expectTypeOf<Item>().toEqualTypeOf<{
      text: string;
      count: number;
      enabled: boolean;
      binary: Buffer;
      date: Date;
      status: "OPEN" | "CLOSED";
    }>();
    expectTypeOf<{ status: "UNKNOWN" }>().not.toExtend<Pick<Item, "status">>();
  });

  test("requires only attributes explicitly marked required", () => {
    type Item = ItemTypeFromSchema<{
      id: { type: "string"; required: true };
      implicit: { type: "number" };
      explicit: { type: "boolean"; required: false };
    }>;

    expectTypeOf<Item>().toEqualTypeOf<{ id: string; implicit?: number; explicit?: boolean }>();
    expectTypeOf<{ id: string }>().toExtend<Item>();
    expectTypeOf<{ implicit: number }>().not.toExtend<Item>();
    expectTypeOf<{ id: undefined }>().not.toExtend<Item>();
    expectTypeOf<{ id: null }>().not.toExtend<Item>();
    expectTypeOf<{ id: number }>().not.toExtend<Item>();
  });

  test("uses aliases by default and falls back to attribute names", () => {
    type Schema = {
      pk: { type: "string"; required: true; alias: "id" };
      data: { type: "number"; alias: "count" };
      unchanged: { type: "boolean" };
    };

    expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{
      id: string;
      count?: number;
      unchanged?: boolean;
    }>();
    expectTypeOf<ItemTypeFromSchema<Schema, { aliasKeys: false }>>().toEqualTypeOf<{
      pk: string;
      data?: number;
      unchanged?: boolean;
    }>();
    // Supplying an options object replaces the default options object.
    expectTypeOf<ItemTypeFromSchema<Schema, { autoAddTimestamps: false }>>().toEqualTypeOf<{
      pk: string;
      data?: number;
      unchanged?: boolean;
    }>();
  });

  test("removes readonly modifiers from schema properties and nested collections", () => {
    const _schema = {
      pk: { type: "string", required: true, alias: "id" },
      profile: {
        type: "map",
        required: true,
        schema: { name: { type: "string", required: true } },
      },
      tags: { type: "array", required: true, schema: [{ type: "string" }] },
    } as const satisfies ModelSchemaType;

    expectTypeOf<ItemTypeFromSchema<typeof _schema>>().toEqualTypeOf<{
      id: string;
      profile: { name: string };
      tags: string[];
    }>();
  });

  test("keeps defaulted attributes required unless optionalIfDefault is enabled", () => {
    type Schema = {
      id: { type: "string"; required: true };
      label: { type: "string"; required: true; default: "untitled" };
      count: { type: "number"; required: true; default: 0 };
      enabled: { type: "boolean"; required: true; default: false };
      generated: { type: "string"; required: true; default: () => string };
      optional: { type: "number"; default: 1 };
    };

    expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{
      id: string;
      label: string;
      count: number;
      enabled: boolean;
      generated: string;
      optional?: number;
    }>();
    expectTypeOf<ItemTypeFromSchema<Schema, { optionalIfDefault: true }>>().toEqualTypeOf<{
      id: string;
      label?: string;
      count?: number;
      enabled?: boolean;
      generated?: string;
      optional?: number;
    }>();
  });

  test("honors explicit nullability for scalars and containers", () => {
    type Item = ItemTypeFromSchema<{
      text: { type: "string"; required: true; nullable: true };
      count: { type: "number"; nullable: true };
      enabled: { type: "boolean"; nullable: true };
      binary: { type: "Buffer"; nullable: true };
      date: { type: "Date"; nullable: true };
      status: { type: "enum"; oneOf: readonly ["OPEN"]; nullable: true };
      map: { type: "map"; nullable: true; schema: { id: { type: "string"; required: true } } };
      list: { type: "array"; nullable: true; schema: readonly [{ type: "number" }] };
      tuple: { type: "tuple"; nullable: true; schema: readonly [{ type: "boolean" }] };
      nonNullable: { type: "string"; nullable: false };
    }>;

    expectTypeOf<Item>().toEqualTypeOf<{
      text: string | null;
      count?: number | null;
      enabled?: boolean | null;
      binary?: Buffer | null;
      date?: Date | null;
      status?: "OPEN" | null;
      map?: { id: string } | null;
      list?: number[] | null;
      tuple?: [boolean] | null;
      nonNullable?: string;
    }>();
  });

  test("adds null only to optional fields when nullableIfOptional is enabled", () => {
    type Item = ItemTypeFromSchema<
      {
        id: { type: "string"; required: true };
        optional: { type: "number" };
        defaulted: { type: "boolean"; required: true; default: false };
        explicitlyNullable: { type: "string"; required: true; nullable: true };
      },
      { nullableIfOptional: true; optionalIfDefault: true }
    >;

    expectTypeOf<Item>().toEqualTypeOf<{
      id: string;
      optional?: number | null;
      defaulted?: boolean | null;
      explicitlyNullable: string | null;
    }>();
  });

  test("recursively maps maps, arrays of maps, and arrays of arrays", () => {
    type Item = ItemTypeFromSchema<{
      profile: {
        type: "map";
        required: true;
        schema: {
          name: { type: "string"; required: true };
          nickname: { type: "string" };
          history: {
            type: "array";
            schema: readonly [
              { type: "map"; schema: { year: { type: "number"; required: true } } },
            ];
          };
        };
      };
      matrix: {
        type: "array";
        schema: readonly [{ type: "array"; schema: readonly [{ type: "number" }] }];
      };
    }>;

    expectTypeOf<Item>().toEqualTypeOf<{
      profile: { name: string; nickname?: string; history?: Array<{ year: number }> };
      matrix?: number[][];
    }>();
  });

  test("maps array and homogeneous tuple elements without adding undefined", () => {
    type Item = ItemTypeFromSchema<{
      list: {
        type: "array";
        required: true;
        schema: readonly [{ type: "string"; nullable: true }];
      };
      tuple: {
        type: "tuple";
        required: true;
        schema: readonly [{ type: "string" }, { type: "string" }];
      };
    }>;

    expectTypeOf<Item>().toEqualTypeOf<{
      list: Array<string | null>;
      tuple: [string, string];
    }>();
  });

  test("propagates alias, default, nullability, and date options through nested schemas", () => {
    type Schema = {
      data: {
        type: "map";
        alias: "profile";
        required: true;
        schema: {
          storedDate: { type: "Date"; alias: "date"; required: true; default: () => Date };
          children: {
            type: "array";
            required: true;
            schema: readonly [
              {
                type: "map";
                schema: {
                  storedName: { type: "string"; alias: "name"; required: true };
                  birthday: { type: "Date" };
                };
              },
            ];
          };
        };
      };
    };

    expectTypeOf<
      ItemTypeFromSchema<
        Schema,
        {
          aliasKeys: true;
          optionalIfDefault: true;
          nullableIfOptional: true;
          convertDatesToStrings: true;
        }
      >
    >().toEqualTypeOf<{
      profile: {
        date?: string | null;
        children: Array<{ name: string; birthday?: string | null }>;
      };
    }>();
    expectTypeOf<
      ItemTypeFromSchema<Schema, { aliasKeys: false; convertDatesToStrings: false }>
    >().toEqualTypeOf<{
      data: { storedDate: Date; children: Array<{ storedName: string; birthday?: Date }> };
    }>();
  });

  test("adds required timestamps only at the top level", () => {
    type Schema = {
      data: { type: "map"; required: true; schema: { date: { type: "Date"; required: true } } };
    };

    expectTypeOf<
      ItemTypeFromSchema<Schema, { autoAddTimestamps: true; convertDatesToStrings: true }>
    >().toEqualTypeOf<{
      data: { date: string };
      createdAt: Date;
      updatedAt: Date;
    }>();
    expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{ data: { date: Date } }>();
  });

  test("maps 32 nested arrays from the public entry point and stops at the 33rd", () => {
    type WithinLimit = ItemTypeFromSchema<{
      value: NestedArraySchema<32> & { required: true };
    }>;
    type BeyondLimit = ItemTypeFromSchema<{
      value: NestedArraySchema<33> & { required: true };
    }>;

    expectTypeOf<ArrayLeaf<WithinLimit["value"]>>().toEqualTypeOf<string>();
    expectTypeOf<ArrayLeaf<BeyondLimit["value"]>>().toBeNever();
  });

  test("supports empty schemas and empty nested maps", () => {
    expectTypeOf<ItemTypeFromSchema<Record<never, never>>>().toEqualTypeOf<Record<never, never>>();
    expectTypeOf<
      ItemTypeFromSchema<{ map: { type: "map"; required: true; schema: Record<never, never> } }>
    >().toEqualTypeOf<{ map: Record<never, never> }>();
    expectTypeOf<
      ItemTypeFromSchema<{ value: { type: "enum"; required: true; oneOf: readonly [] } }>["value"]
    >().toBeNever();
  });

  test("infers heterogeneous array and tuple schemas as unions instead of never[]", () => {
    type Schema = {
      list: {
        type: "array";
        required: true;
        schema: readonly [{ type: "string" }, { type: "number" }];
      };
      tuple: {
        type: "tuple";
        required: true;
        schema: readonly [{ type: "string" }, { type: "number" }];
      };
    };

    expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{
      list: Array<string | number>;
      tuple: [string, number];
    }>();
  });

  test("infers empty array elements as never and preserves empty tuple schemas", () => {
    type Schema = {
      list: { type: "array"; required: true; schema: readonly [] };
      tuple: { type: "tuple"; required: true; schema: readonly [] };
    };

    expectTypeOf<ItemTypeFromSchema<Schema>>().toEqualTypeOf<{ list: never[]; tuple: [] }>();
  });
});

describe("AttrValue", () => {
  test("rejects incomplete enum and container configurations", () => {
    expectTypeOf<AttrValue<{ type: "enum" }, Record<never, never>, 0>>().toBeNever();
    expectTypeOf<AttrValue<{ type: "map" }, Record<never, never>, 0>>().toBeNever();
    expectTypeOf<AttrValue<{ type: "array" }, Record<never, never>, 0>>().toBeNever();
    expectTypeOf<AttrValue<{ type: "tuple" }, Record<never, never>, 0>>().toBeNever();
  });

  test("allows scalar values at depth 32 but rejects additional containers", () => {
    expectTypeOf<AttrValue<{ type: "string" }, Record<never, never>, 32>>().toEqualTypeOf<string>();
    expectTypeOf<AttrValue<{ type: "number" }, Record<never, never>, 32>>().toEqualTypeOf<number>();
    expectTypeOf<
      AttrValue<{ type: "boolean" }, Record<never, never>, 32>
    >().toEqualTypeOf<boolean>();
    expectTypeOf<AttrValue<{ type: "Buffer" }, Record<never, never>, 32>>().toEqualTypeOf<Buffer>();
    expectTypeOf<
      AttrValue<{ type: "Date" }, { convertDatesToStrings: true }, 32>
    >().toEqualTypeOf<string>();
    expectTypeOf<
      AttrValue<{ type: "enum"; oneOf: readonly ["YES"] }, Record<never, never>, 32>
    >().toEqualTypeOf<"YES">();
    expectTypeOf<
      AttrValue<{ type: "map"; schema: { id: { type: "string" } } }, Record<never, never>, 32>
    >().toBeNever();
    expectTypeOf<
      AttrValue<{ type: "array"; schema: readonly [{ type: "string" }] }, Record<never, never>, 32>
    >().toBeNever();
    expectTypeOf<
      AttrValue<{ type: "tuple"; schema: readonly [{ type: "string" }] }, Record<never, never>, 32>
    >().toBeNever();
  });

  test("permits the final container at depth 31 and stops its nested containers", () => {
    expectTypeOf<
      AttrValue<
        { type: "map"; schema: { id: { type: "string"; required: true } } },
        Record<never, never>,
        31
      >
    >().toEqualTypeOf<{ id: string }>();
    expectTypeOf<
      AttrValue<{ type: "array"; schema: readonly [{ type: "number" }] }, Record<never, never>, 31>
    >().toEqualTypeOf<number[]>();
    expectTypeOf<
      AttrValue<
        { type: "array"; schema: readonly [{ type: "map"; schema: { id: { type: "string" } } }] },
        Record<never, never>,
        31
      >
    >().toEqualTypeOf<never[]>();
  });
});
