import type { CreateTableInput } from "@aws-sdk/client-dynamodb";

/**
 * These static mock items are returned by the `@aws-sdk/lib-dynamodb` mock module,
 * located in `<repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts`.
 */

/** Mock dates used in the mock items below. */
export const MOCK_DATES = {
  JAN_1_2020: new Date("2020-01-01T00:00:00.000Z"),
  JAN_2_2020: new Date("2020-01-02T00:00:00.000Z"),
  JAN_3_2020: new Date("2020-01-03T00:00:00.000Z"),
};

/** Mock user items */
export const MOCK_USERS = {
  USER_A: {
    id: "USER#A",
    sk: "#DATA#USER#A",
    handle: "@user_A",
    email: "userA@gmail.com",
    phone: "(888) 111-1111",
    profile: {
      displayName: "Mock McHumanPerson",
      businessName: "Definitely Not a Penguin in a Human Costume, LLC",
      photoUrl: "s3://mock-bucket-name/path/to/human/photo.jpg",
    },
    createdAt: MOCK_DATES.JAN_1_2020,
    updatedAt: MOCK_DATES.JAN_1_2020,
  },
  USER_B: {
    id: "USER#B",
    sk: "#DATA#USER#B",
    handle: "@user_B",
    email: "user_B@gmail.com",
    phone: "(888) 222-2222",
    profile: {
      displayName: "Rick Sanchez",
      businessName: "Science Inc.",
      photoUrl: "s3://mock-bucket-name/path/to/ricks/photo.jpg",
    },
    createdAt: MOCK_DATES.JAN_2_2020,
    updatedAt: MOCK_DATES.JAN_2_2020,
  },
  USER_C: {
    id: "USER#C",
    sk: "#DATA#USER#C",
    handle: "@user_C",
    email: "user_C@gmail.com",
    phone: "(888) 333-3333",
    profile: {
      displayName: "@user_C",
      businessName: null,
      photoUrl: null,
    },
    createdAt: MOCK_DATES.JAN_3_2020,
    updatedAt: MOCK_DATES.JAN_3_2020,
  },
};

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
      IndexName: "Overloaded_SK_GSI",
      KeySchema: [
        { AttributeName: "sk", KeyType: "HASH" },
        { AttributeName: "data", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
    },
    {
      IndexName: "Overloaded_Data_GSI",
      KeySchema: [
        { AttributeName: "data", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
    },
  ],
};
