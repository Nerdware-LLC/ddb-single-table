import { checkRequired } from "./checkRequired.js";
import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction.js";
import type { IOActions, IOActionContext } from "./types.js";
import type { ModelSchemaType } from "../../Schema/index.js";

describe("IOAction: checkRequired", () => {
  // Mock `this` context with bound methods: `checkRequired` and `recursivelyApplyIOAction`
  const mockThis = {} as IOActions;
  (mockThis as any).checkRequired = checkRequired.bind(mockThis);
  (mockThis as any).recursivelyApplyIOAction = recursivelyApplyIOAction.bind(mockThis);

  // Mock item with nested attributes
  const mockItem = {
    id: "USER-1",
    name: "Human McPerson",
    age: 32,
    books: [
      {
        bookID: "BOOK-1",
        // missing "notRequiredBookProp"
        author: {
          authorID: "AUTHOR-1",
          // missing "notRequiredAuthorProp"
          FOO_TUPLE: ["foo", 123, true],
          publisher: {
            publisherID: "PUBLISHER-1",
            // missing "notRequiredPublisherProp"
            address: {
              street: "123 Main St",
              // missing "notRequiredAddressProp"
            },
          },
        },
      },
    ],
  };

  // Mock schema with an attribute with a nest-depth of 5 (the current max for ItemTypeFromSchema)
  const mockSchema = {
    id: { type: "string", required: true },
    books: {
      type: "array", // nest level 1
      required: true,
      schema: [
        {
          type: "map", // nest level 2
          required: true,
          schema: {
            bookID: { type: "string", required: true },
            notRequiredBookProp: { type: "string" },
            author: {
              type: "map", // nest level 3
              required: true,
              schema: {
                authorID: { type: "string", required: true },
                notRequiredAuthorProp: { type: "string" },
                FOO_TUPLE: {
                  type: "tuple",
                  required: true,
                  schema: [
                    { type: "string", required: true },
                    { type: "number", required: true },
                    { type: "boolean", required: false },
                  ],
                },
                publisher: {
                  type: "map", // nest level 4
                  required: true,
                  schema: {
                    publisherID: { type: "string", required: true },
                    notRequiredPublisherProp: { type: "string" },
                    address: {
                      type: "map", // nest level 5
                      required: true,
                      schema: {
                        street: { type: "string", required: true },
                        notRequiredAddressProp: { type: "string" },
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
  } satisfies ModelSchemaType;

  const mockCtx = {
    modelName: "MockModel",
    schema: mockSchema,
    schemaEntries: Object.entries(mockSchema),
  } as const satisfies Partial<IOActionContext>;

  test(`returns the provided "item" when all "required" fields are present`, () => {
    expect(checkRequired.call(mockThis, mockItem, mockCtx as any)).toStrictEqual(mockItem);
  });

  test(`throws an ItemInputError when a "required" field is missing`, () => {
    // Same mockSchema as above, but with "MISSING_ATTR" added to the `address` nested schema
    const mockSchemaWithAddressMISSING_ATTR = {
      ...mockCtx.schema,
      books: {
        ...mockCtx.schema.books,
        schema: [
          {
            ...mockCtx.schema.books.schema[0],
            schema: {
              ...mockCtx.schema.books.schema[0].schema,
              author: {
                ...mockCtx.schema.books.schema[0].schema.author,
                schema: {
                  ...mockCtx.schema.books.schema[0].schema.author.schema,
                  publisher: {
                    ...mockCtx.schema.books.schema[0].schema.author.schema.publisher,
                    schema: {
                      ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema,
                      address: {
                        ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema
                          .address,
                        schema: {
                          ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema
                            .address.schema,
                          MISSING_ATTR: { type: "string", required: true },
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

    const contextWithAddressMISSING_ATTR = {
      ...mockCtx,
      schema: mockSchemaWithAddressMISSING_ATTR,
      schemaEntries: Object.entries(mockSchemaWithAddressMISSING_ATTR),
    };

    expect(() =>
      checkRequired.call(mockThis, mockItem, contextWithAddressMISSING_ATTR as any)
    ).toThrowError(`A value is required for MockModel property "MISSING_ATTR".`);
  });
});
