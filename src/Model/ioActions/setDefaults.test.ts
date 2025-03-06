import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction.js";
import { setDefaults } from "./setDefaults.js";
import type { IOActions, IOActionContext } from "./types.js";
import type { ModelSchemaType } from "../../Schema/index.js";

describe("IOAction: setDefaults", () => {
  // Mock `this` context with bound methods: `setDefaults` and `recursivelyApplyIOAction`
  const mockThis = {} as IOActions;
  (mockThis as any).setDefaults = setDefaults.bind(mockThis);
  (mockThis as any).recursivelyApplyIOAction = recursivelyApplyIOAction.bind(mockThis);

  // Mock item with nested attributes
  const mockItem = {
    id: "USER-1",
    EXISTING_ATTR: "EXISTING_VALUE",
    // missing top-level "FOO" attr, `setDefaults` set it to "FOO_VALUE"
    // missing top-level "BAR" attr, `setDefaults` set it to "USER-1-BAR"
    books: [
      {
        bookID: "BOOK-1",
        author: {
          authorID: "AUTHOR-1",
          publisher: {
            publisherID: "PUBLISHER-1",
            address: {
              street: "123 Main St",
              EXISTING_ATTR: "EXISTING_VALUE",
              // missing nested "FOO" attr, `setDefaults` set it to "123 Main St-FOO"
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
      default: "FOO_VALUE", // <-- top-level string default for FOO
    },
    BAR: {
      type: "string",
      default: (item: { id: string }) => `${item.id}-BAR`, // <-- top-level functional default for BAR
    },
    EXISTING_ATTR: {
      type: "string",
      default: "THIS_STRING_SHOULD_NOT_BE_IN_THE_RESULT",
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
                        FOO: {
                          type: "string",
                          // This nested `default` function also tests that the entire
                          // parent item is provided as the arg to the `default` function.
                          default: (item: any) => {
                            return `${item.books[0].author.publisher.address.street as string}-FOO`;
                          },
                        },
                        BAR: {
                          type: "string",
                          default: "BAR_VALUE",
                        },
                        EXISTING_ATTR: {
                          type: "string",
                          default: "THIS_STRING_SHOULD_NOT_BE_IN_THE_RESULT",
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

  test(`returns the provided "item" with configured "default" values where applicable`, () => {
    expect(setDefaults.call(mockThis, mockItem, mockCtx)).toStrictEqual({
      ...mockItem,
      FOO: "FOO_VALUE",
      BAR: "USER-1-BAR",
      books: [
        {
          ...mockItem.books[0],
          author: {
            ...mockItem.books[0].author,
            publisher: {
              ...mockItem.books[0].author.publisher,
              address: {
                ...mockItem.books[0].author.publisher.address,
                FOO: "123 Main St-FOO",
                BAR: "BAR_VALUE",
              },
            },
          },
        },
      ],
    });
  });
});
