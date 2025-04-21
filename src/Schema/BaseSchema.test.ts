import { BaseSchema } from "./BaseSchema.js";
import type { TableKeysSchemaType, ModelSchemaType, SchemaMetadata } from "./types/index.js";

describe("BaseSchema", () => {
  describe("BaseSchema.validateAttributeTypes()", () => {
    // SHARED TEST VALUES:

    /** SchemaMetadata objects (2nd param of `BaseSchema.validateAttributeTypes`) */
    const METADATA = {
      TK_SCHEMA: { schemaType: "TableKeysSchema" },
      M_SCHEMA: { schemaType: "ModelSchema" },
    } as const satisfies Record<string, SchemaMetadata>;

    const ERR_MSG_PREFIX = {
      TK_SCHEMA: "TableKeysSchema is invalid:",
      M_SCHEMA: "ModelSchema is invalid:",
    };

    test("validates a valid ModelSchemaType with all supported types and attributes", () => {
      const modelSchema: ModelSchemaType = {
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

      expect(() =>
        BaseSchema.validateAttributeTypes(modelSchema, METADATA.M_SCHEMA)
      ).not.toThrowError();
    });

    test("validates a valid TableKeysSchemaType with all supported types and attributes", () => {
      const tableKeysSchema: TableKeysSchemaType = {
        pk: { type: "string", required: true, isHashKey: true },
        sk: { type: "number", required: true, isRangeKey: true },
        fooKey: {
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

      expect(() =>
        BaseSchema.validateAttributeTypes(tableKeysSchema, METADATA.TK_SCHEMA)
      ).not.toThrowError();
    });

    test("validates a ModelSchemaType with optional attributes", () => {
      const modelSchema: ModelSchemaType<{ pk: { type: "string"; required: true } }> = {
        pk: { type: "string", required: true },
        optionalAttr: { type: "number" },
      };

      expect(() =>
        BaseSchema.validateAttributeTypes(modelSchema, METADATA.M_SCHEMA)
      ).not.toThrowError();
    });

    test("throws a SchemaValidationError when an invalid schema is provided", () => {
      expect(() => BaseSchema.validateAttributeTypes([] as any, METADATA.M_SCHEMA)).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} schema must be a plain object, but received "Array".`
      );
      expect(() => BaseSchema.validateAttributeTypes(null as any, METADATA.M_SCHEMA)).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} schema must be a plain object, but received "Null".`
      );
      expect(() =>
        BaseSchema.validateAttributeTypes(undefined as any, METADATA.M_SCHEMA)
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} schema must be a plain object, but received "undefined".`
      );
    });

    test("throws a SchemaValidationError when an empty schema is provided", () => {
      expect(() => BaseSchema.validateAttributeTypes({} as any, METADATA.M_SCHEMA)).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} schema does not contain any attributes.`
      );
    });

    test("throws a SchemaValidationError when an attribute does not specify a type", () => {
      expect(() =>
        BaseSchema.validateAttributeTypes({ attr: {} } as any, METADATA.M_SCHEMA)
      ).toThrowError(`${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" does not specify a "type".`);
    });

    test("throws a SchemaValidationError when an attribute specifies an invalid type", () => {
      expect(() =>
        BaseSchema.validateAttributeTypes({ attr: { type: "BAD_TYPE" } } as any, METADATA.M_SCHEMA)
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" has an invalid "type" value (must be "string", "number", "boolean", "Buffer", "Date", "map", "array", "tuple", or "enum").`
      );
    });

    test(`throws a SchemaValidationError when an attribute is of type "map", "array", or "tuple", but does not specify a nested "schema"`, () => {
      expect(() =>
        BaseSchema.validateAttributeTypes({ mapAttr: { type: "map" } } as any, METADATA.M_SCHEMA)
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "mapAttr" is of type "map", but does not specify a nested "schema".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { arrayAttr: { type: "array" } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "arrayAttr" is of type "array", but does not specify a nested "schema".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { tupleAttr: { type: "tuple" } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "tupleAttr" is of type "tuple", but does not specify a nested "schema".`
      );
    });

    test(`throws a SchemaValidationError when an attribute is of type "map", "array", or "tuple", and "schema" is the wrong type`, () => {
      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "map", schema: [] } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" is of type "map", but its nested "schema" is not an object.`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "array", schema: {} } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" is of type "array", but its nested "schema" is not an array.`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "tuple", schema: {} } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" is of type "tuple", but its nested "schema" is not an array.`
      );
    });

    test(`throws a SchemaValidationError when an attribute is of type "enum", and "oneOf" is invalid`, () => {
      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "enum", oneOf: {} } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" is of type "enum", but does not specify a valid "oneOf" array.`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "enum", oneOf: [] } } as any,
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" is of type "enum", but does not specify a valid "oneOf" array.`
      );
    });

    test(`throws a SchemaValidationError when an attribute's "default" does not align with its "type"`, () => {
      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "string", default: 1 } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "number", but the attribute's configured "type" is "string".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "number", default: "" } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "number".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "boolean", default: "" } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "boolean".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "Buffer", default: "" } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "Buffer".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "Date", default: "" } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "Date".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "map", default: "", schema: { nestedAttr: { type: "string" } } } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "map".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "array", default: "", schema: [{ type: "string" }] } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "array".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "tuple", default: "", schema: [{ type: "string" }] } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "tuple".`
      );

      expect(() =>
        BaseSchema.validateAttributeTypes(
          { attr: { type: "enum", default: "", oneOf: ["x"] } },
          METADATA.M_SCHEMA
        )
      ).toThrowError(
        `${ERR_MSG_PREFIX.M_SCHEMA} attribute "attr" specifies a "default" value of type "string", but the attribute's configured "type" is "enum".`
      );
    });
  });
});
