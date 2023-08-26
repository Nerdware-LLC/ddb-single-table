import { mockClient } from "aws-sdk-client-mock";
import type {
  ListTablesOutput,
  DescribeTableInput,
  DescribeTableOutput,
  CreateTableInput,
  CreateTableOutput,
} from "@aws-sdk/client-dynamodb";

const {
  DynamoDBClient: _DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
  ListTablesCommand,
} = await vi.importActual<typeof import("@aws-sdk/client-dynamodb")>("@aws-sdk/client-dynamodb");

const MOCK_TABLE: { [Key in keyof CreateTableInput]: Exclude<CreateTableInput[Key], undefined> } = {
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

const DynamoDBClient = vi.fn(() =>
  mockClient(_DynamoDBClient)
    .on(DescribeTableCommand)
    .callsFake(({ TableName }: DescribeTableInput): DescribeTableOutput => {
      return {
        Table: {
          ...MOCK_TABLE,
          TableName,
          TableStatus: "ACTIVE",
          BillingModeSummary: { BillingMode: MOCK_TABLE.BillingMode },
        },
      };
    })
    .on(CreateTableCommand)
    .callsFake(({ BillingMode, ...args }: CreateTableInput): CreateTableOutput => {
      return {
        TableDescription: {
          ...args,
          TableStatus: "ACTIVE",
          BillingModeSummary: { BillingMode },
        },
      };
    })
    .on(ListTablesCommand)
    .callsFake((): ListTablesOutput => ({ TableNames: [MOCK_TABLE.TableName] }))
);

export { DynamoDBClient, DescribeTableCommand, CreateTableCommand, ListTablesCommand };
