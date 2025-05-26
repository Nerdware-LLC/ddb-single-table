import { convertJsTypes } from "./convertJsTypes.js";
import { recursivelyApplyIOAction } from "./recursivelyApplyIOAction.js";
import type { IOActions, IOActionContext } from "./types.js";
import type { ModelSchemaType } from "../../Schema/index.js";

describe("IOAction: convertJsTypes", () => {
  // Mock `this` context with bound methods: `convertJsTypes` and `recursivelyApplyIOAction`
  const mockThis = {} as IOActions;
  (mockThis as any).convertJsTypes = convertJsTypes.bind(mockThis);
  (mockThis as any).recursivelyApplyIOAction = recursivelyApplyIOAction.bind(mockThis);

  // Mock value for Date types
  const JAN_1_2020_ISO_STR = "2020-01-01T00:00:00.000Z";

  /**
   * Mock value inputs for converted types:
   *
   * | `JS Type` | `DynamoDB Type`  |
   * | :-------- | :--------------- |
   * | Date      | unix timestamp   |
   * | Buffer    | binary string    |
   */
  const CONVERSION_VALUES = {
    JS: {
      DATE: new Date(JAN_1_2020_ISO_STR),
    },
    DDB: {
      DATE: 1577836800,
      BUFFER: Buffer.from("foo").toString("binary"),
    },
  };

  // Mock toDB item with JS types and nested attributes
  const mockToDbItem = {
    id: "USER-1",
    ...CONVERSION_VALUES.JS,
    DATE_ISO_STR: JAN_1_2020_ISO_STR,
    books: [
      {
        bookID: "BOOK-1",
        author: {
          authorID: "AUTHOR-1",
          publisher: {
            publisherID: "PUBLISHER-1",
            address: {
              street: "123 Main St",
              ...CONVERSION_VALUES.JS,
              DATE_ISO_STR: JAN_1_2020_ISO_STR,
            },
          },
        },
      },
    ],
  };

  // Mock schema with an attribute with a nest-depth of 5 (the current max for ItemTypeFromSchema)
  const mockSchema = {
    id: { type: "string", required: true },
    DATE: { type: "Date" }, //         <-- top-level Date
    DATE_ISO_STR: { type: "Date" }, // <-- top-level Date (fromDB will be ISO-8601 string)
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
                        DATE: { type: "Date" }, //         <-- nested Date
                        DATE_ISO_STR: { type: "Date" }, // <-- nested Date (fromDB will be ISO-8601 string)
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

  test(`converts JS types to DDB types when "ioDirection" is "toDB"`, () => {
    const result = convertJsTypes.call(mockThis, mockToDbItem, {
      ...mockCtx,
      ioDirection: "toDB",
    } as any);

    expect(result.DATE).toStrictEqual(CONVERSION_VALUES.DDB.DATE);
    expect((result as any).books[0].author.publisher.address.DATE).toStrictEqual(
      CONVERSION_VALUES.DDB.DATE
    );

    expect(result.DATE_ISO_STR).toStrictEqual(CONVERSION_VALUES.DDB.DATE);
    expect((result as any).books[0].author.publisher.address.DATE_ISO_STR).toStrictEqual(
      CONVERSION_VALUES.DDB.DATE
    );
  });

  test(`converts DDB types to JS types when "ioDirection" is "fromDB"`, () => {
    // Mock item with DDB types
    const mockFromDbItem = {
      ...mockToDbItem,
      ...CONVERSION_VALUES.DDB, //         <-- top-level Date and Buffer
      DATE_ISO_STR: JAN_1_2020_ISO_STR, // <-- top-level ISO-8601 string
      books: [
        {
          ...mockToDbItem.books[0],
          author: {
            ...mockToDbItem.books[0].author,
            publisher: {
              ...mockToDbItem.books[0].author.publisher,
              address: {
                street: "123 Main St",
                ...CONVERSION_VALUES.DDB, //         <-- nested Date and Buffer
                DATE_ISO_STR: JAN_1_2020_ISO_STR, // <-- nested ISO-8601 string
              },
            },
          },
        },
      ],
    };

    const result = convertJsTypes.call(mockThis, mockFromDbItem, {
      ...mockCtx,
      ioDirection: "fromDB",
    } as any);

    expect(result.DATE).toStrictEqual(CONVERSION_VALUES.JS.DATE);
    expect((result as any).books[0].author.publisher.address.DATE).toStrictEqual(
      CONVERSION_VALUES.JS.DATE
    );

    expect(result.DATE_ISO_STR).toStrictEqual(CONVERSION_VALUES.JS.DATE);
    expect((result as any).books[0].author.publisher.address.DATE_ISO_STR).toStrictEqual(
      CONVERSION_VALUES.JS.DATE
    );
  });

  test.each([
    { ioDirection: "toDB", convertableValueType: "Date" },
    { ioDirection: "fromDB", convertableValueType: "Date" },
  ])(
    `leaves unexpected $convertableValueType values unchanged when "ioDirection" is "$ioDirection"`,
    ({ ioDirection, convertableValueType }) => {
      // Arrange mock item with unexpected value:
      const UNEXPECTED_VALUE = Symbol("unexpected");
      const fieldName = convertableValueType.toUpperCase();

      const result = convertJsTypes.call(
        mockThis,
        { ...mockToDbItem, [fieldName]: UNEXPECTED_VALUE },
        { ...mockCtx, ioDirection } as any
      );

      expect(result[fieldName]).toStrictEqual(UNEXPECTED_VALUE);
    }
  );
});
