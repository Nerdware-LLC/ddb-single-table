import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction";
import { validate } from "./validate";
import type { ModelSchemaType } from "../../Schema";
import type { IOActions, IOActionContext } from "./types";

describe("IOActionMethod: validate", () => {
  // Mock `this` context with bound methods: `validate` and `recursivelyApplyIOAction`
  const mockThis = {} as IOActions;
  (mockThis as any).validate = validate.bind(mockThis);
  (mockThis as any).recursivelyApplyIOAction = recursivelyApplyIOAction.bind(mockThis);

  // Mock item with nested attributes
  const mockItem = {
    id: "USER-1",
    FOO: "GOOD_FOO_VALUE",
    books: [
      {
        bookID: "BOOK-1",
        author: {
          authorID: "AUTHOR-1",
          publisher: {
            publisherID: "PUBLISHER-1",
            address: {
              street: "123 Main St",
              NESTED_FOO: "GOOD_NESTED_FOO_VALUE",
            },
          },
        },
      },
    ],
  };

  // Mock schema with an attribute with a nest-depth of 5 (the current max for ItemTypeFromSchema)
  const mockSchema: ModelSchemaType = {
    id: { type: "string", required: true },
    FOO: {
      type: "string",
      validate: (value: string) => /GOOD.*FOO.*VALUE/.test(value), // <-- top-level FOO validate fn
    },
    BAR: {
      // BAR's validate fn will cause an Error to be thrown if mockItem includes a "BAR" attr.
      type: "string",
      validate: () => false,
    },
    books: {
      type: "array", // nest level 1
      required: true,
      schema: [
        {
          type: "map", // nest level 2
          required: true,
          schema: {
            bookID: { type: "string", required: true },
            author: {
              type: "map", // nest level 3
              required: true,
              schema: {
                authorID: { type: "string", required: true },
                publisher: {
                  type: "map", // nest level 4
                  required: true,
                  schema: {
                    publisherID: { type: "string", required: true },
                    address: {
                      type: "map", // nest level 5
                      required: true,
                      schema: {
                        street: { type: "string", required: true },
                        NESTED_FOO: {
                          type: "string",
                          validate: (value: string) => /GOOD.*FOO.*VALUE/.test(value),
                        },
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

  it(`should return the provided "item" when all validate fns return true`, () => {
    expect(validate.call(mockThis, mockItem, mockCtx)).toStrictEqual(mockItem);
  });

  it(`should throw an ItemInputError if a validate fn returns false`, () => {
    expect(() =>
      validate.call(mockThis, { ...mockItem, BAR: "SHOULD_THROW" }, mockCtx)
    ).toThrow(/Invalid value for MockModel property "BAR"./i); // prettier-ignore
  });
});
