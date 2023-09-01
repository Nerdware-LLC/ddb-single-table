import type { CreateTableInput } from "@aws-sdk/client-dynamodb";
import type { ModelSchemaType, ItemTypeFromSchema } from "../types";

/**
 * These static mock items are returned by the following manually mocked modules:
 *
 * | Package                    | Location of Mock Implementation                     |
 * | :------------------------- | :-------------------------------------------------- |
 * | `@aws-sdk/lib-dynamodb`    | `<repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts`    |
 * | `@aws-sdk/client-dynamodb` | `<repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts` |
 */

/** Mock {@link CreateTableInput} args */
export const MOCK_TABLE: {
  [Key in keyof CreateTableInput]: Exclude<CreateTableInput[Key], undefined>;
} = {
  TableName: "mock-table",
  BillingMode: "PROVISIONED",
  AttributeDefinitions: [
    { AttributeName: "pk", AttributeType: "S" },
    { AttributeName: "sk", AttributeType: "S" },
    { AttributeName: "data", AttributeType: "S" },
  ],
  KeySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "overloaded_sk_gsi",
      KeySchema: [
        { AttributeName: "sk", KeyType: "HASH" },
        { AttributeName: "data", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
    },
    {
      IndexName: "overloaded_data_gsi",
      KeySchema: [
        { AttributeName: "data", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
    },
  ],
};

/** Mock items Model schema (arbitrarily structured as "user" items) */
export const MOCK_ITEMS_SCHEMA = {
  pk: { alias: "id", type: "string", required: true },
  sk: { alias: "handle", type: "string", required: true },
  data: { alias: "email", type: "string", required: true },
  profile: {
    type: "map",
    required: true,
    schema: {
      displayName: { type: "string", required: true },
      businessName: { type: "string" },
      photoUrl: { type: "string" },
    },
  },
  createdAt: { type: "Date", required: true },
  updatedAt: { type: "Date", required: true },
} as const satisfies ModelSchemaType;

/** Typing for {@link MOCK_ITEMS} (arbitrarily structured as "user" items) */
export type StaticMockItemType = ItemTypeFromSchema<typeof MOCK_ITEMS_SCHEMA>;

/** Mock dates used in the mock items below. */
export const MOCK_DATES = {
  JAN_1_2020: new Date("2020-01-01T00:00:00.000Z"),
  JAN_2_2020: new Date("2020-01-02T00:00:00.000Z"),
  JAN_3_2020: new Date("2020-01-03T00:00:00.000Z"),
};

/** Mock items (arbitrarily structured as "user" items) */
export const MOCK_ITEMS = {
  ITEM_A: {
    id: "USER#A",
    handle: "@human_user",
    email: "a_human@example.com",
    profile: {
      displayName: "Human McPerson",
      businessName: "Definitely Not a Penguin in a Human Costume, LLC",
      photoUrl: "s3://mock-bucket-name/path/to/human/photo.jpg",
    },
    createdAt: MOCK_DATES.JAN_1_2020,
    updatedAt: MOCK_DATES.JAN_1_2020,
  },
  USER_B: {
    id: "USER#B",
    handle: "@han_solo",
    email: "han_solo@millenium_falcon.biz",
    profile: {
      displayName: "Han Solo",
      businessName: "Smuggler Inc.",
      photoUrl: "s3://mock-bucket-name/path/to/hans/photo.jpg",
    },
    createdAt: MOCK_DATES.JAN_2_2020,
    updatedAt: MOCK_DATES.JAN_2_2020,
  },
  USER_C: {
    id: "USER#C",
    handle: "@foo",
    email: "foo@bar.com",
    profile: {
      displayName: "Foo Name",
      businessName: null,
      photoUrl: null,
    },
    createdAt: MOCK_DATES.JAN_3_2020,
    updatedAt: MOCK_DATES.JAN_3_2020,
  },
} satisfies Record<string, StaticMockItemType>;
