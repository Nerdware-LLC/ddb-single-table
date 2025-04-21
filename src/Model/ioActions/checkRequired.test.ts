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
              nullableAddressProp: null,
              // missing "notRequiredAddressProp" and "nullishAddressProp"
            },
          },
        },
      },
    ],
  };

  // Mock schema with an attribute with a nest-depth of 5
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
                        nullishAddressProp: { type: "string", nullable: true },
                        nullableAddressProp: { type: "string", nullable: true, required: true },
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
  } as const satisfies ModelSchemaType;

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
                      // prettier-ignore
                      address: {
                        ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema.address,
                        schema: {
                          ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema.address.schema,
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

  test(`throws an ItemInputError when a non-"nullable" field is null`, () => {
    // Same mockSchema as above, but with "NON_NULL_ATTR" added to the `address` nested schema
    const mockSchemaWithAddressNON_NULL_ATTR = {
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
                      // prettier-ignore
                      address: {
                        ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema.address,
                        schema: {
                          ...mockCtx.schema.books.schema[0].schema.author.schema.publisher.schema.address.schema,
                          NON_NULL_ATTR: { type: "string", nullable: false },
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

    const contextWithAddressNON_NULL_ATTR = {
      ...mockCtx,
      schema: mockSchemaWithAddressNON_NULL_ATTR,
      schemaEntries: Object.entries(mockSchemaWithAddressNON_NULL_ATTR),
    };

    expect(() =>
      checkRequired.call(
        mockThis,
        {
          ...mockItem,
          books: [
            {
              ...mockItem.books[0],
              author: {
                ...mockItem.books[0].author,
                publisher: {
                  ...mockItem.books[0].author.publisher,
                  address: {
                    ...mockItem.books[0].author.publisher.address,
                    NON_NULL_ATTR: null, // <-- this should cause an error
                  },
                },
              },
            },
          ],
        },
        contextWithAddressNON_NULL_ATTR as any
      )
    ).toThrowError(`A non-null value is required for MockModel property "NON_NULL_ATTR".`);
  });
});
