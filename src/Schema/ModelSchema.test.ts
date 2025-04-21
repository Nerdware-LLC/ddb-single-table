import { ModelSchema } from "./ModelSchema.js";
import type { ModelSchemaType, ModelSchemaMetadata } from "./types/index.js";
import type { TableKeysAndIndexes } from "../Table/types.js";

describe("ModelSchema", () => {
  describe("ModelSchema.validate()", () => {
    // SHARED TEST VALUES:

    const METADATA: ModelSchemaMetadata = { name: "FooModelSchema" };
    const ERR_MSG_PREFIX = `${METADATA.name} is invalid:`;

    test("validates a valid ModelSchemaType with all supported types and attributes", () => {
      const schema: ModelSchemaType = {
        stringAttr: { type: "string" },
        numberAttr: { type: "number" },
        booleanAttr: { type: "boolean" },
        bufferAttr: { type: "Buffer" },
        dateAttr: { type: "Date" },
        arrayAttr: { type: "array", schema: [{ type: "string" }] },
        mapAttr: { type: "map", schema: { nestedAttr: { type: "number" } } },
        tupleAttr: { type: "tuple", schema: [{ type: "string" }, { type: "number" }] },
        enumAttr: { type: "enum", oneOf: ["value1", "value2"] },
      };

      expect(() => ModelSchema.validate(schema, METADATA)).not.toThrowError();
    });

    test("validates a ModelSchemaType with optional attributes", () => {
      const schema: ModelSchemaType<{ pk: { type: "string"; required: true } }> = {
        pk: { type: "string", required: true },
        optionalAttr: { type: "number" },
      };

      expect(() => ModelSchema.validate(schema, METADATA)).not.toThrowError();
    });

    test("throws a SchemaValidationError when an attribute specifies isHashKey, isRangeKey, or an index", () => {
      expect(() =>
        ModelSchema.validate({ attr: { type: "string", isHashKey: true } } as any, METADATA)
      ).toThrowError(
        `${ERR_MSG_PREFIX} attribute "attr" includes an "isHashKey" config, which is only valid in the TableKeysSchema.`
      );
      expect(() =>
        ModelSchema.validate({ attr: { type: "string", isRangeKey: true } } as any, METADATA)
      ).toThrowError(
        `${ERR_MSG_PREFIX} attribute "attr" includes an "isRangeKey" config, which is only valid in the TableKeysSchema.`
      );
      expect(() =>
        ModelSchema.validate({ attr: { type: "string", index: {} } } as any, METADATA)
      ).toThrowError(
        `${ERR_MSG_PREFIX} attribute "attr" includes an "index" config, which is only valid in the TableKeysSchema.`
      );
    });

    test(`throws a SchemaValidationError when multiple attributes have the same "alias"`, () => {
      expect(() =>
        ModelSchema.validate(
          {
            attr1: { type: "string", alias: "attrAlias" },
            attr2: { type: "string", alias: "attrAlias" },
          } as any,
          METADATA
        )
      ).toThrowError(`${ERR_MSG_PREFIX} the ModelSchema contains duplicate alias "attrAlias".`);
    });
  });

  describe("ModelSchema.getSortedSchemaEntries()", () => {
    test("returns an array of sorted ModelSchema entries", () => {
      const TABLE_KEYS_AND_INDEXES: TableKeysAndIndexes = {
        tableHashKey: "pk",
        tableRangeKey: "sk",
        indexes: {
          gsi: { name: "gsi", type: "GLOBAL", indexPK: "fooAttr", indexSK: "quxAttr" },
        },
      };

      const SORTED = [
        ["pk", { type: "string" }],
        ["sk", { type: "string" }],
        ["fooAttr", { type: "string" }],
        ["barAttr", { type: "string" }],
        ["quxAttr", { type: "string" }],
      ];

      expect(
        ModelSchema.getSortedSchemaEntries(
          {
            //                              DESCRIPTION       INDEX IN SORTED ARRAY
            barAttr: { type: "string" }, // non-key attr      3
            fooAttr: { type: "string" }, // gsi pk            2
            quxAttr: { type: "string" }, // gsi sk            4
            sk: { type: "string" }, //      table range key   1
            pk: { type: "string" }, //      table hash key    0
          } satisfies ModelSchemaType,
          TABLE_KEYS_AND_INDEXES
        )
      ).toEqual(SORTED);
    });
  });
});
