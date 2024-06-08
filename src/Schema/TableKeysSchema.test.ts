import { TableKeysSchema } from "./TableKeysSchema.js";
import type { TableKeysSchemaType } from "./types.js";

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

  describe("TableKeysSchema.validate()", () => {
    test("validates a valid TableKeysSchemaType with all supported types and attributes", () => {
      expect(() => TableKeysSchema.validate(VALID_TABLE_KEYS_SCHEMA)).not.toThrowError();
    });

    test("throws a SchemaValidationError when a key attribute does not specify isHashKey, isRangeKey, nor an index", () => {
      const schema = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: { type: "string", required: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
        `${ERR_MSG_PREFIX} attribute "attr" is not configured as a key or index.`
      );
    });

    test(`throws a SchemaValidationError when a key attribute specifies an invalid "type"`, () => {
      const schema = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: { type: "Date", required: true, isHashKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
        `${ERR_MSG_PREFIX} attribute "attr" has an invalid "type" (must be "string", "number", or "Buffer").`
      );
    });

    test(`throws a SchemaValidationError when a key attribute is not configured as "required"`, () => {
      const schema = {
        ...VALID_TABLE_KEYS_SCHEMA,
        attr: { type: "string", required: false, isHashKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
        `${ERR_MSG_PREFIX} attribute "attr" is not "required".`
      );
    });

    test(`throws a SchemaValidationError when the schema includes two hash-key attributes`, () => {
      const schema: TableKeysSchemaType = {
        firstHashKey: { type: "string", required: true, isHashKey: true },
        secondHashKey: { type: "string", required: true, isHashKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
        `${ERR_MSG_PREFIX} multiple table hash keys ("firstHashKey" and "secondHashKey").`
      );
    });

    test(`throws a SchemaValidationError when the schema includes two range-key attributes`, () => {
      const schema: TableKeysSchemaType = {
        pk: { type: "string", required: true, isHashKey: true },
        firstRangeKey: { type: "string", required: true, isRangeKey: true },
        secondRangeKey: { type: "string", required: true, isRangeKey: true },
      };

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
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

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
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

      expect(() => TableKeysSchema.validate(schema as any)).toThrowError(
        `${ERR_MSG_PREFIX} multiple indexes with the same name ("${DUPE_INDEX_NAME}").`
      );
    });

    test(`throws a SchemaValidationError when the schema does not specify table hash-key`, () => {
      expect(() => TableKeysSchema.validate({ sk: VALID_TABLE_KEYS_SCHEMA.sk })).toThrowError(
        `${ERR_MSG_PREFIX} the schema does not contain a hash key (must specify exactly one attribute with "isHashKey: true").`
      );
    });

    test(`throws a SchemaValidationError when the schema does not specify a table range-key`, () => {
      expect(() => TableKeysSchema.validate({ pk: VALID_TABLE_KEYS_SCHEMA.pk })).toThrowError(
        `${ERR_MSG_PREFIX} the schema does not contain a range key (must specify exactly one attribute with "isRangeKey: true").`
      );
    });
  });

  describe("TableKeysSchema.getMergedModelSchema()", () => {
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

    test("throws a SchemaValidationError if the ModelSchema conflicts with the TableKeysSchema", () => {
      expect(() =>
        TableKeysSchema.getMergedModelSchema({
          tableKeysSchema: VALID_TABLE_KEYS_SCHEMA,
          modelSchema: {
            pk: { type: "number", required: true }, // <-- conflicting "type"
          },
        })
      ).toThrowError(
        `ModelSchema is invalid: the "type" config in the ModelSchema for key attribute "pk" does not match the TableKeysSchema.`
      );

      expect(() =>
        TableKeysSchema.getMergedModelSchema({
          tableKeysSchema: VALID_TABLE_KEYS_SCHEMA,
          modelSchema: {
            pk: { type: "string", required: false }, // <-- conflicting "required"
          },
        })
      ).toThrowError(
        `ModelSchema is invalid: the "required" config in the ModelSchema for key attribute "pk" does not match the TableKeysSchema.`
      );
    });
  });
});
