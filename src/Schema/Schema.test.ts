import { Schema } from "./Schema.js";
import { SchemaValidationError } from "../utils/errors.js";
import type { TableKeysSchemaType, ModelSchemaType } from "./types.js";

describe("Schema", () => {
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
      Schema.validateAttributeTypes(modelSchema, { schemaType: "ModelSchema" })
    ).not.toThrow();
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
      Schema.validateAttributeTypes(tableKeysSchema, { schemaType: "TableKeysSchema" })
    ).not.toThrow();
  });

  test("validates a ModelSchemaType with optional attributes", () => {
    const modelSchema: ModelSchemaType<{ pk: { type: "string"; required: true } }> = {
      pk: { type: "string", required: true },
      optionalAttr: { type: "number" },
    };

    expect(() =>
      Schema.validateAttributeTypes(modelSchema, { schemaType: "ModelSchema" })
    ).not.toThrow();
  });

  test("throws a SchemaValidationError when an invalid schema is provided", () => {
    const metadata = { schemaType: "ModelSchema" } as const;
    expect(() => Schema.validateAttributeTypes([] as any, metadata)).toThrow(SchemaValidationError);
    expect(() => Schema.validateAttributeTypes({} as any, metadata)).toThrow(SchemaValidationError);
  });

  test("throws a SchemaValidationError when an attribute does not specify a type", () => {
    const schema = { attr: {} };

    expect(() =>
      Schema.validateAttributeTypes(schema as any, { schemaType: "ModelSchema" })
    ).toThrow(SchemaValidationError);
  });

  test("throws a SchemaValidationError when an attribute specifies an invalid type", () => {
    const schema = { attr: { type: "BAD_TYPE" } };

    expect(() =>
      Schema.validateAttributeTypes(schema as any, { schemaType: "ModelSchema" })
    ).toThrow(SchemaValidationError);
  });

  test(`throws a SchemaValidationError when an attribute is of type "map", "array", or "tuple", but does not specify a nested "schema"`, () => {
    const metadata = { schemaType: "ModelSchema" } as const;

    expect(() =>
      Schema.validateAttributeTypes({ mapAttr: { type: "map" } } as any, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ arrayAttr: { type: "array" } } as any, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ tupleAttr: { type: "tuple" } } as any, metadata)
    ).toThrow(SchemaValidationError);
  });

  test(`throws a SchemaValidationError when an attribute is of type "map", "array", or "tuple", and "schema" is the wrong type`, () => {
    const metadata = { schemaType: "ModelSchema" } as const;

    expect(() =>
      Schema.validateAttributeTypes({ mapAttr: { type: "map", schema: [] } } as any, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ arrayAttr: { type: "array", schema: {} } } as any, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ tupleAttr: { type: "tuple", schema: {} } } as any, metadata)
    ).toThrow(SchemaValidationError);
  });

  test(`throws a SchemaValidationError when an attribute is of type "enum", and "oneOf" is invalid`, () => {
    const metadata = { schemaType: "ModelSchema" } as const;

    expect(() =>
      Schema.validateAttributeTypes({ enumAttr: { type: "enum", oneOf: {} } } as any, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ enumAttr: { type: "enum", oneOf: [] } } as any, metadata)
    ).toThrow(SchemaValidationError);
  });

  test(`throws a SchemaValidationError when an attribute's "default" does not align with its "type"`, () => {
    const metadata = { schemaType: "ModelSchema" } as const;

    expect(() =>
      Schema.validateAttributeTypes({ fooAttr: { type: "string", default: 1 } }, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ fooAttr: { type: "number", default: "" } }, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ fooAttr: { type: "boolean", default: "" } }, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ fooAttr: { type: "Buffer", default: "" } }, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes({ fooAttr: { type: "Date", default: "" } }, metadata)
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes(
        { fooAttr: { type: "map", default: "", schema: { x: { type: "string" } } } },
        metadata
      )
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes(
        { fooAttr: { type: "array", default: "", schema: [{ type: "string" }] } },
        metadata
      )
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes(
        { fooAttr: { type: "tuple", default: "", schema: [{ type: "string" }] } },
        metadata
      )
    ).toThrow(SchemaValidationError);
    expect(() =>
      Schema.validateAttributeTypes(
        { fooAttr: { type: "enum", default: "", oneOf: ["x"] } },
        metadata
      )
    ).toThrow(SchemaValidationError);
  });
});
