import { expectTypeOf } from "vitest";
import type { ItemCreationParameters, ItemTypeFromSchema } from "./index.js";

describe("ItemCreationParameters", () => {
  type Schema = {
    pk: { type: "string"; required: true; alias: "id" };
    sk: { type: "string"; required: true; default: () => string };
    active: { type: "boolean"; required: true; default: false };
    date: { type: "Date"; required: true };
    profile: {
      type: "map";
      schema: {
        name: { type: "string"; required: true };
        age: { type: "number"; required: true; default: 0 };
      };
    };
  };

  test("uses aliases and makes defaulted attributes optional at every level", () => {
    expectTypeOf<ItemCreationParameters<Schema>>().toEqualTypeOf<{
      id: string;
      sk?: string;
      active?: boolean;
      date: Date;
      profile?: { name: string; age?: number };
    }>();
    expectTypeOf<{ id: string; date: Date }>().toExtend<ItemCreationParameters<Schema>>();
    expectTypeOf<{ date: Date }>().not.toExtend<ItemCreationParameters<Schema>>();
    expectTypeOf<{ id: string; date: Date; profile: { age: number } }>().not.toExtend<
      ItemCreationParameters<Schema>
    >();
  });

  test("differs from the output item type for required attributes with defaults", () => {
    expectTypeOf<ItemCreationParameters<Schema>>().not.toExtend<ItemTypeFromSchema<Schema>>();
    expectTypeOf<ItemTypeFromSchema<Schema>>().toExtend<ItemCreationParameters<Schema>>();
  });

  test("replaces creation defaults when explicit options are supplied", () => {
    expectTypeOf<
      ItemCreationParameters<Schema, { aliasKeys: false; optionalIfDefault: false }>
    >().toEqualTypeOf<{
      pk: string;
      sk: string;
      active: boolean;
      date: Date;
      profile?: { name: string; age: number };
    }>();
    expectTypeOf<
      ItemCreationParameters<
        Schema,
        {
          aliasKeys: true;
          optionalIfDefault: true;
          nullableIfOptional: true;
          convertDatesToStrings: true;
          autoAddTimestamps: true;
        }
      >
    >().toEqualTypeOf<{
      id: string;
      sk?: string | null;
      active?: boolean | null;
      date: string;
      profile?: { name: string; age?: number | null } | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
  });
});
