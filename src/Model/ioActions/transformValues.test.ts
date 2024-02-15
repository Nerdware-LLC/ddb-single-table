import lodashSet from "lodash.set";
import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction.js";
import { transformValues } from "./transformValues.js";
import type { ModelSchemaType } from "../../Schema/types.js";
import type { IOActions, IOActionContext, IODirection } from "./types.js";

describe("IOAction: transformValues", () => {
  // Mock `this` context with bound methods: `transformValues` and `recursivelyApplyIOAction`
  const mockThis = {} as IOActions;
  (mockThis as any).transformValues = transformValues.bind(mockThis);
  (mockThis as any).recursivelyApplyIOAction = recursivelyApplyIOAction.bind(mockThis);

  // Mock item with nested attributes
  const mockItem = {
    id: "USER-1",
    FOO: "FOO_VALUE",
    books: [
      {
        bookID: "BOOK-1",
        author: {
          authorID: "AUTHOR-1",
          publisher: {
            publisherID: "PUBLISHER-1",
            address: {
              street: "123 Main St",
              NESTED_FOO: "NESTED_FOO_VALUE",
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
      transformValue: {
        toDB: (value: string) => `${value}-toDB-FOO`,
        fromDB: (value: string) => `${value}-fromDB-FOO`,
      },
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
                          transformValue: {
                            toDB: (value: string) => `${value}-toDB-FOO`,
                            fromDB: (value: string) => `${value}-fromDB-FOO`,
                          },
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

  const mockCtx = {
    modelName: "MockModel",
    schema: mockSchema,
    schemaEntries: Object.entries(mockSchema),
  } as IOActionContext;

  it(`should return the transformed "item" values as configured via transformValue fns`, () => {
    (["toDB", "fromDB"] satisfies Array<IODirection>).forEach((ioDirection) => {
      const expectedItemResult = { ...mockItem };
      lodashSet(expectedItemResult, "FOO", `${mockItem.FOO}-${ioDirection}-FOO`);
      lodashSet(
        expectedItemResult,
        "books[0].author.publisher.address.NESTED_FOO",
        `${mockItem.books[0].author.publisher.address.NESTED_FOO}-${ioDirection}-FOO`
      );

      const result = transformValues.call(mockThis, mockItem, { ...mockCtx, ioDirection });

      expect(result).toStrictEqual(expectedItemResult);
    });
  });
});
