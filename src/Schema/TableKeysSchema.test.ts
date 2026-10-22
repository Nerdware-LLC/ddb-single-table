import { TableKeysSchema } from "./TableKeysSchema.js";
import type { TableKeysSchemaType } from "./types/TableKeysSchemaType.js";
import type { MergeModelAndTableKeysSchema } from "./types/index.js";

describe("TableKeysSchema", () => {
  // SHARED TEST INPUTS:

  const VALID_TABLE_KEYS_SCHEMA: TableKeysSchemaType = {
    pk: { type: "string", required: true, isHashKey: true },
    sk: { type: "number", required: true, isRangeKey: true },
    fooIndexPK: {
      type: "Buffer",
      required: true,
      index: {
        name: "foo_index",
        rangeKey: "sk",
        global: true,
        project: true,
        throughput: { read: 1, write: 1 },
      },
    },
  };

  const ERR_MSG_PREFIX = `TableKeysSchema is invalid:`;

  describe("validate", () => {
    test(`returns an object with just "tableHashKey" when called with a schema that only contains a pk`, () => {
      expect(TableKeysSchema.validate({ pk: VALID_TABLE_KEYS_SCHEMA.pk })).toStrictEqual({
        tableHashKey: "pk",
      });
    });

    test(`returns an object with the keys defined in a schema that only contains a pk and sk`, () => {
      expect(
        TableKeysSchema.validate({ pk: VALID_TABLE_KEYS_SCHEMA.pk, sk: VALID_TABLE_KEYS_SCHEMA.sk })
      ).toStrictEqual({
        tableHashKey: "pk",
        tableRangeKey: "sk",
      });
    });

    test(`returns an object with the keys+indexes defined in the provided schema`, () => {
      expect(TableKeysSchema.validate(VALID_TABLE_KEYS_SCHEMA)).toStrictEqual({
        tableHashKey: "pk",
        tableRangeKey: "sk",
        indexes: {
          foo_index: {
            name: "foo_index",
            type: "GLOBAL",
            indexPK: "fooIndexPK",
            indexSK: "sk",
          },
        },
      });
    });

    test("validates a valid TableKeysSchemaType with all supported types and attributes", () => {
      expect(() => TableKeysSchema.validate(VALID_TABLE_KEYS_SCHEMA)).not.toThrow();
    });

    test("throws a SchemaValidationError when a key attribute does not specify isHashKey, isRangeKey, nor an index", () => {
      const schema = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: { type: "string", required: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} attribute "attr" is not configured as a key or index.`
      );
    });

    test(`throws a SchemaValidationError when a key attribute specifies an invalid "type"`, () => {
      const schema = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: { type: "Date", required: true, isHashKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} attribute "attr" has an invalid "type" (must be "string", "number", or "Buffer").`
      );
    });

    test(`throws a SchemaValidationError when a key attribute is not configured as "required"`, () => {
      const schema = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: { type: "string", required: false, isHashKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} attribute "attr" is not "required".`
      );
    });

    test(`throws a SchemaValidationError when the schema includes two hash-key attributes`, () => {
      const schema: TableKeysSchemaType = {
        firstHashKey: { type: "string", required: true, isHashKey: true },
        secondHashKey: { type: "string", required: true, isHashKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} multiple table hash keys ("firstHashKey" and "secondHashKey").`
      );
    });

    test(`throws a SchemaValidationError when the schema includes two range-key attributes`, () => {
      const schema: TableKeysSchemaType = {
        pk: { type: "string", required: true, isHashKey: true },
        firstRangeKey: { type: "string", required: true, isRangeKey: true },
        secondRangeKey: { type: "string", required: true, isRangeKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} multiple table range keys ("firstRangeKey" and "secondRangeKey").`
      );
    });

    test(`throws a SchemaValidationError when the schema includes an "index" with no "name"`, () => {
      const schema: TableKeysSchemaType = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: {
          type: "string",
          required: true,
          index: {} as any,
        },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} the index for attribute "attr" is missing a "name".`
      );
    });

    test(`throws a SchemaValidationError when the schema includes multiple indexes with the same "name"`, () => {
      const DUPE_INDEX_NAME = "dupe_index";

      const schema: TableKeysSchemaType = {
        ...VALID_TABLE_KEYS_SCHEMA,
        firstIndexHashKey: {
          type: "string",
          required: true,
          index: { name: DUPE_INDEX_NAME },
        },
        secondIndexHashKey: {
          type: "string",
          required: true,
          index: { name: DUPE_INDEX_NAME },
        },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrow(
        `${ERR_MSG_PREFIX} multiple indexes with the same name ("${DUPE_INDEX_NAME}").`
      );
    });

    test(`throws a SchemaValidationError when the schema does not specify table hash-key`, () => {
      expect(() => TableKeysSchema.validate({ sk: VALID_TABLE_KEYS_SCHEMA.sk })).toThrow(
        `${ERR_MSG_PREFIX} the schema does not contain a hash key (must specify exactly one attribute with "isHashKey: true").`
      );
    });

    test("defaults indexes to GLOBAL and validates LOCAL constraints and references", () => {
      const pk = { type: "string", required: true, isHashKey: true } as const;

      expect(
        TableKeysSchema.validate({
          pk,
          other: { type: "string", required: true, index: { name: "gsi" } },
        }).indexes?.gsi.type
      ).toBe("GLOBAL");

      expect(() =>
        TableKeysSchema.validate({
          pk,
          other: { type: "string", required: true, index: { name: "lsi", global: false } },
        })
      ).toThrow("local index");

      expect(() =>
        TableKeysSchema.validate({ pk: { ...pk, index: { name: "bad", rangeKey: "missing" } } })
      ).toThrow("unknown range");

      const result = TableKeysSchema.validate({
        pk: { ...pk, index: { name: "lsi", global: false, rangeKey: "other" } },
        sk: { type: "string", required: true, isRangeKey: true },
        other: { type: "string", required: true, index: { name: "gsi" } },
      });

      expect(result.indexes?.lsi).toMatchObject({ type: "LOCAL", indexPK: "pk", indexSK: "other" });
    });
  });

  describe("getMergedModelSchema", () => {
    test("merges the TableKeysSchema into the provided ModelSchema", () => {
      expect(
        TableKeysSchema.getMergedModelSchema({
          tableKeysSchema: VALID_TABLE_KEYS_SCHEMA,
          modelSchema: {
            pk: { type: "string", isHashKey: true },
            attr1: { type: "string", required: true },
            attr2: { type: "number", required: false },
          },
        })
      ).toEqual({
        pk: { type: "string", required: true },
        sk: { type: "number", required: true },
        fooIndexPK: { type: "Buffer", required: true },
        attr1: { type: "string", required: true },
        attr2: { type: "number", required: false },
      });
    });

    test("merges frozen configs without mutation and honors model overrides at runtime and type level", () => {
      const pk = { type: "string", required: true, isHashKey: true } as const;
      const table = { pk: { ...pk, alias: "tableID", default: "table" } } as const;
      const model = Object.freeze({ pk: Object.freeze({ alias: "id", default: "model" }) });
      const merged = TableKeysSchema.getMergedModelSchema({
        tableKeysSchema: table,
        modelSchema: model,
      });

      expect(merged.pk).toStrictEqual({
        type: "string",
        required: true,
        alias: "id",
        default: "model",
      });

      expect(model.pk).toStrictEqual({ alias: "id", default: "model" });

      expectTypeOf<
        MergeModelAndTableKeysSchema<typeof table, typeof model>["pk"]["alias"]
      >().toEqualTypeOf<"id">();

      const inherited = TableKeysSchema.getMergedModelSchema({
        tableKeysSchema: table,
        modelSchema: { pk: { alias: "id" } },
      });

      expect(inherited.pk.default).toBe("table");
    });

    test("throws a SchemaValidationError if the ModelSchema conflicts with the TableKeysSchema", () => {
      expect(() =>
        TableKeysSchema.getMergedModelSchema({
          tableKeysSchema: VALID_TABLE_KEYS_SCHEMA,
          modelSchema: {
            pk: { type: "number", required: true }, // <-- conflicting "type"
          },
        })
      ).toThrow(
        `ModelSchema is invalid: the "type" config in the ModelSchema for key attribute "pk" does not match the TableKeysSchema.`
      );

      expect(() =>
        TableKeysSchema.getMergedModelSchema({
          tableKeysSchema: VALID_TABLE_KEYS_SCHEMA,
          modelSchema: {
            pk: { type: "string", required: false }, // <-- conflicting "required"
          },
        })
      ).toThrow(
        `ModelSchema is invalid: the "required" config in the ModelSchema for key attribute "pk" does not match the TableKeysSchema.`
      );
    });
  });
});
