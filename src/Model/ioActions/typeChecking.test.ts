import lodashSet from "lodash.set";
import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction";
import { typeChecking } from "./typeChecking";
import type { ModelSchemaType } from "../../types";
import type { IOActions, IOActionContext } from "./types";

describe("IOActionMethod: typeChecking", () => {
  // Mock `this` context with bound methods: `typeChecking` and `recursivelyApplyIOAction`
  const mockThis = {} as IOActions;
  (mockThis as any).typeChecking = typeChecking.bind(mockThis);
  (mockThis as any).recursivelyApplyIOAction = recursivelyApplyIOAction.bind(mockThis);

  // An object for mockItem with values of every supported type:
  const VALID_VALUE_TYPE_INPUTS = {
    STRING: "STRING_VALUE",
    NUMBER: 10,
    BOOLEAN: true,
    DATE: new Date(),
    ENUM: "FOO",
    ARRAY: ["FOO", "BAR"],
    TUPLE: ["FOO", 10],
    MAP: { FOO: "FOO_VALUE" },
    BUFFER: Buffer.from("BUFFER_VALUE"),
  };

  // The schema attr configs for VALID_VALUE_TYPE_INPUTS:
  const SCHEMA_VALUE_ATTRIBUTES: ModelSchemaType = {
    STRING: { type: "string" },
    NUMBER: { type: "number" },
    BOOLEAN: { type: "boolean" },
    DATE: { type: "Date" },
    ENUM: { type: "enum", oneOf: ["FOO", "BAR"] },
    ARRAY: { type: "array", schema: [{ type: "string" }] },
    TUPLE: { type: "tuple", schema: [{ type: "string" }, { type: "number" }] },
    MAP: { type: "map", schema: { FOO: { type: "string" } } },
    BUFFER: { type: "Buffer" },
  };

  // Mock item with nested attributes
  const mockItem = {
    ...VALID_VALUE_TYPE_INPUTS,
    books: [
      {
        bookID: "BOOK-1",
        author: {
          authorID: "AUTHOR-1",
          publisher: {
            publisherID: "PUBLISHER-1",
            nestedValues: {
              ...VALID_VALUE_TYPE_INPUTS,
            },
          },
        },
      },
    ],
  };

  // Mock schema with an attribute with a nest-depth of 5 (the current max for ItemTypeFromSchema)
  const mockSchema: ModelSchemaType = {
    ...SCHEMA_VALUE_ATTRIBUTES,
    books: {
      type: "array", // nest level 1
      schema: [
        {
          type: "map", // nest level 2
          schema: {
            bookID: { type: "string" },
            author: {
              type: "map", // nest level 3
              schema: {
                authorID: { type: "string" },
                publisher: {
                  type: "map", // nest level 4
                  schema: {
                    publisherID: { type: "string" },
                    nestedValues: {
                      type: "map", // nest level 5
                      schema: {
                        ...SCHEMA_VALUE_ATTRIBUTES,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  };

  // Mock ctx with the schema
  const mockCtx = {
    modelName: "MockModel",
    schema: mockSchema,
    schemaEntries: Object.entries(mockSchema),
  } as IOActionContext;

  it("should return the item if all attributes are of the correct type", () => {
    expect(typeChecking.call(mockThis, mockItem, mockCtx)).toEqual(mockItem);
  });

  it("should throw an ItemInputError when provided an item with an incorrect type", () => {
    Object.entries(VALID_VALUE_TYPE_INPUTS).forEach(([key, value]) => {
      // Test bad value-type on top-level property:
      expect(() =>
        typeChecking.call(
          mockThis,
          {
            ...mockItem,
            [key]: typeof value === "string" ? { BAD_KEY: "BAD_VALUE" } : "BAD_VALUE",
          },
          mockCtx
        )
      ).toThrow(/Invalid type of value provided/i);

      // Test bad value-type on nested property:
      const mockItemWithBadNestedValue = { ...mockItem };
      lodashSet(
        mockItemWithBadNestedValue,
        `books[0].author.publisher.nestedValues.${key}`,
        typeof value === "string" ? { BAD_KEY: "BAD_VALUE" } : "BAD_VALUE"
      );

      expect(() =>
        typeChecking.call(mockThis, mockItemWithBadNestedValue, mockCtx)
      ).toThrow(/Invalid type of value provided/i); // prettier-ignore
    });
  });
});
