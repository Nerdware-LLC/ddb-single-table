import { mockClient } from "aws-sdk-client-mock";
const { DynamoDBClient: _DynamoDBClient, DescribeTableCommand, CreateTableCommand, ListTablesCommand, } = await vi.importActual("@aws-sdk/client-dynamodb");
const MOCK_TABLE = {
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
const DynamoDBClient = vi.fn(() => mockClient(_DynamoDBClient)
    .on(DescribeTableCommand)
    .callsFake(({ TableName }) => {
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
    .callsFake(({ BillingMode, ...args }) => {
    return {
        TableDescription: {
            ...args,
            TableStatus: "ACTIVE",
            BillingModeSummary: { BillingMode },
        },
    };
})
    .on(ListTablesCommand)
    .callsFake(() => ({ TableNames: [MOCK_TABLE.TableName] })));
export { DynamoDBClient, DescribeTableCommand, CreateTableCommand, ListTablesCommand };
