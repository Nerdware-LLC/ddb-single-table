import {
  DynamoDBClient,
  // MODEL-METHOD COMMANDS
  GetItemCommand,
  BatchGetItemCommand,
  PutItemCommand,
  BatchWriteItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteItemsCommand,
  // TABLE-METHOD COMMANDS
  DescribeTableCommand,
  CreateTableCommand,
  ListTablesCommand,
  // Other types
  type WriteRequest,
  type ItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { ItemInputError } from "../utils/errors.js";
import { DdbClientWrapper } from "./DdbClientWrapper.js";
import type {
  // MODEL-METHOD IO TYPES
  ClientWrapperGetItemInput,
  ClientWrapperBatchGetItemInput,
  ClientWrapperPutItemInput,
  ClientWrapperBatchWriteItemInput,
  ClientWrapperUpdateItemInput,
  ClientWrapperDeleteItemInput,
  ClientWrapperQueryInput,
  ClientWrapperScanInput,
  ClientWrapperTransactWriteItemsInput,
  // TABLE-METHOD IO TYPES
  ClientWrapperDescribeTableInput,
  ClientWrapperCreateTableInput,
  // UNMARSHALLED SDK TYPES
  UnmarshalledBatchWriteRequest,
} from "./types/index.js";

describe("DdbClientWrapper", () => {
  // MOCK DdbClientWrapper INPUTS:

  const ddbClient = new DynamoDBClient({
    region: "local",
    endpoint: "http://localhost:8000",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });

  const mockDdbClient = mockClient(ddbClient);

  const mockTableName: string = "MockTable";
  const mockDdbClientWrapper = new DdbClientWrapper({ tableName: mockTableName, ddbClient });

  // Arrange mockDdbClient to return an empty object by default:
  beforeEach(() => {
    mockDdbClient.reset();
    mockDdbClient.onAnyCommand().resolves({}); // Default response for all commands
  });

  // Mock item inputs:
  const mockItems = [
    { id: "USER-1", name: "Human McPerson", data: 32 },
    { id: "USER-2", name: "Canine McPup", data: 7 },
    { id: "USER-3", name: "Foo Fooerson", data: 20 },
  ];
  // For single-item methods:
  const mockItem = mockItems[0];
  // For batch methods like `batchGetItems` which only use the items' keys:
  const mockItemsKeys = mockItems.map(({ id }) => ({ id }));
  // Marshalled items:
  const mockItemsMarshalled = mockItems.map((item) => mockDdbClientWrapper.marshall(item));
  const mockItemMarshalled = mockItemsMarshalled[0];

  // Other mock values:
  const mockItemCollectionMetrics: ItemCollectionMetrics = {
    ItemCollectionKey: {},
    SizeEstimateRangeGB: [0, 1],
  };

  describe("new DdbClientWrapper()", () => {
    test("returns a valid DdbClientWrapper instance when called with valid arguments", () => {
      // Assert instance is of correct type:
      expect(mockDdbClientWrapper).toBeInstanceOf(DdbClientWrapper);
    });
  });

  describe("getItem()", () => {
    // Valid GetItem input:
    const getItemValidInput = {
      Key: { id: mockItem.id },
    } as const satisfies ClientWrapperGetItemInput;

    test(`creates a GetCommand and returns mocked "Item" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mockItemMarshalled
      mockDdbClient.on(GetItemCommand).resolvesOnce({ Item: mockItemMarshalled });

      const result = await mockDdbClientWrapper.getItem(getItemValidInput);

      // Assert the result
      expect(result).toStrictEqual({ Item: mockItem });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(GetItemCommand, {
        TableName: mockTableName,
        Key: mockDdbClientWrapper.marshall(getItemValidInput.Key),
      });
    });

    test(`returns undefined "Item" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.getItem(getItemValidInput);
      expect(result.Item).toBeUndefined();
    });

    test(`throws an error when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.getItem(null as any)).rejects.toThrowError();
    });
  });

  describe("batchGetItems()", () => {
    // Valid BatchGetItem input:
    const batchGetItemValidInput = {
      RequestItems: {
        [mockTableName]: {
          Keys: mockItemsKeys,
        },
      },
    } as const satisfies ClientWrapperBatchGetItemInput;

    test(`creates a BatchGetCommand and returns mocked "Responses" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mockItemsMarshalled
      mockDdbClient.on(BatchGetItemCommand).resolvesOnce({
        Responses: { [mockTableName]: mockItemsMarshalled },
        ConsumedCapacity: [{}],
      });

      const result = await mockDdbClientWrapper.batchGetItems(batchGetItemValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        Responses: { [mockTableName]: mockItems },
        ConsumedCapacity: [{}],
        $metadata: undefined,
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(BatchGetItemCommand, {
        RequestItems: {
          [mockTableName]: {
            Keys: mockItemsKeys.map((itemKeys) => mockDdbClientWrapper.marshall(itemKeys)),
          },
        },
      });
    });

    test(`returns undefined "Responses" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.batchGetItems(batchGetItemValidInput);
      expect(result.Responses).toBeUndefined();
    });

    test(`throws when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.batchGetItems({} as any)).rejects.toThrowError();
      await expect(mockDdbClientWrapper.batchGetItems(null as any)).rejects.toThrowError();
    });
  });

  describe("putItem()", () => {
    // Valid PutItem input:
    const putItemValidInput = {
      Item: mockItem,
      ExpressionAttributeValues: { ":id": mockItem.id },
    } as const satisfies ClientWrapperPutItemInput;

    test(`creates a PutCommand and returns mocked "Attributes" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mockItemMarshalled
      mockDdbClient.on(PutItemCommand).resolvesOnce({
        Attributes: mockItemMarshalled,
        ItemCollectionMetrics: mockItemCollectionMetrics,
      });

      const result = await mockDdbClientWrapper.putItem(putItemValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        Attributes: mockItem,
        ItemCollectionMetrics: mockItemCollectionMetrics,
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(PutItemCommand, {
        TableName: mockTableName,
        Item: mockItemMarshalled,
        ExpressionAttributeValues: mockDdbClientWrapper.marshall(
          putItemValidInput.ExpressionAttributeValues
        ),
      });
    });

    test(`returns undefined "Attributes" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.putItem(putItemValidInput);
      expect(result.Attributes).toBeUndefined();
    });

    test(`throws when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.putItem(null as any)).rejects.toThrowError();
    });
  });

  describe("updateItem()", () => {
    // Mock values shared by multiple `updateItem()` tests:
    const mockUpdatedName = "NEW_NAME";
    const mockUpdatedItem = { ...mockItem, name: mockUpdatedName };

    // Valid UpdateItem input:
    const updateItemValidInput = {
      Key: { id: mockItem.id },
      UpdateExpression: "SET #name = :name",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":name": mockUpdatedName },
      ReturnValues: "ALL_NEW",
    } as const satisfies ClientWrapperUpdateItemInput;

    test(`creates an UpdateCommand and returns mocked "Attributes" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mockItem with updated "name"
      mockDdbClient.on(UpdateItemCommand).resolvesOnce({
        Attributes: mockDdbClientWrapper.marshall(mockUpdatedItem),
        ItemCollectionMetrics: mockItemCollectionMetrics,
      });

      const result = await mockDdbClientWrapper.updateItem(updateItemValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        Attributes: mockUpdatedItem,
        ItemCollectionMetrics: mockItemCollectionMetrics,
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(UpdateItemCommand, {
        TableName: mockTableName,
        Key: mockDdbClientWrapper.marshall(updateItemValidInput.Key),
        UpdateExpression: updateItemValidInput.UpdateExpression,
        ExpressionAttributeNames: updateItemValidInput.ExpressionAttributeNames,
        ExpressionAttributeValues: mockDdbClientWrapper.marshall(
          updateItemValidInput.ExpressionAttributeValues
        ),
        ReturnValues: updateItemValidInput.ReturnValues,
      });
    });

    test(`returns undefined "Attributes" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.updateItem(updateItemValidInput);
      expect(result.Attributes).toBeUndefined();
    });

    test(`throws when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.updateItem(null as any)).rejects.toThrowError();
    });
  });

  describe("deleteItem()", () => {
    // Valid DeleteItem input:
    const deleteItemValidInput = {
      Key: { id: mockItem.id },
      ExpressionAttributeValues: { ":id": mockItem.id },
    } as const satisfies ClientWrapperDeleteItemInput;

    test(`creates a DeleteCommand and returns mocked "Attributes" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mockItem
      mockDdbClient.on(DeleteItemCommand).resolvesOnce({
        Attributes: mockItemMarshalled,
        ItemCollectionMetrics: mockItemCollectionMetrics,
      });

      const result = await mockDdbClientWrapper.deleteItem(deleteItemValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        Attributes: mockItem,
        ItemCollectionMetrics: mockItemCollectionMetrics,
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(DeleteItemCommand, {
        TableName: mockTableName,
        Key: mockDdbClientWrapper.marshall(deleteItemValidInput.Key),
        ExpressionAttributeValues: mockDdbClientWrapper.marshall(
          deleteItemValidInput.ExpressionAttributeValues
        ),
      });
    });

    test(`returns undefined "Attributes" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.deleteItem(deleteItemValidInput);
      expect(result.Attributes).toBeUndefined();
    });

    test(`throws when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.deleteItem(null as any)).rejects.toThrowError();
    });
  });

  describe("batchWriteItems()", () => {
    // Mock BatchWriteItem PutRequest objects, marshalled and unmarshalled:
    const { mockBatchWriteRequests, marshalledMockBatchWriteRequests } = mockItems.reduce<{
      mockBatchWriteRequests: Array<UnmarshalledBatchWriteRequest>;
      marshalledMockBatchWriteRequests: Array<WriteRequest>;
    }>(
      (accum, itemObj) => {
        accum.mockBatchWriteRequests.push({ PutRequest: { Item: itemObj } });
        accum.marshalledMockBatchWriteRequests.push({
          PutRequest: { Item: mockDdbClientWrapper.marshall(itemObj) },
        });
        return accum;
      },
      { mockBatchWriteRequests: [], marshalledMockBatchWriteRequests: [] }
    );

    // Valid BatchWriteItem input:
    const batchWriteItemValidInput = {
      RequestItems: {
        [mockTableName]: mockBatchWriteRequests,
      },
      batchConfigs: {
        retryConfigs: { disableDelay: true },
      },
    } as const satisfies ClientWrapperBatchWriteItemInput;

    test(`creates a BatchWriteCommand and returns mocked "UnprocessedItems" when called with valid arguments`, async () => {
      /*
        Arrange ddbClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes mockBatchWriteRequests to trigger the retry logic (excludes the first item via .slice(1))
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      mockDdbClient
        .on(BatchWriteItemCommand)
        .resolvesOnce({
          UnprocessedItems: { [mockTableName]: marshalledMockBatchWriteRequests.slice(1) },
          ItemCollectionMetrics: { [mockTableName]: [mockItemCollectionMetrics] },
          ConsumedCapacity: [{}],
        })
        .resolvesOnce({});

      const result = await mockDdbClientWrapper.batchWriteItems(batchWriteItemValidInput);

      // Assert the result (UnprocessedItems will be undefined because nothing is returned)
      expect(result).toStrictEqual({
        // UnprocessedItems should not be included
        ItemCollectionMetrics: { [mockTableName]: [mockItemCollectionMetrics] },
        ConsumedCapacity: [{}],
        $metadata: undefined,
      });

      // Assert the args provided to the SDK commands
      expect(mockDdbClient).toHaveReceivedCommandTimes(BatchWriteItemCommand, 2);
      expect(mockDdbClient).toHaveReceivedNthCommandWith(BatchWriteItemCommand, 1, {
        RequestItems: { [mockTableName]: marshalledMockBatchWriteRequests },
      });
      expect(mockDdbClient).toHaveReceivedNthCommandWith(BatchWriteItemCommand, 2, {
        RequestItems: { [mockTableName]: marshalledMockBatchWriteRequests.slice(1) },
      });
    });

    test(`returns undefined when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.batchWriteItems(batchWriteItemValidInput);
      expect(result.ConsumedCapacity).toBeUndefined();
    });

    test(`throws an ItemInputError when called without any valid WriteRequest objects`, async () => {
      await expect(
        mockDdbClientWrapper.batchWriteItems({
          RequestItems: {
            [mockTableName]: [{}],
          },
        })
      ).rejects.toThrowError(ItemInputError);
    });

    test(`throws an error when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.batchWriteItems({} as any)).rejects.toThrowError();
      await expect(mockDdbClientWrapper.batchWriteItems(null as any)).rejects.toThrowError();
    });
  });

  describe("query()", () => {
    // Valid Query input:
    const queryValidInput = {
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": "pk" },
      ExpressionAttributeValues: { ":pk": mockItem.id },
      ExclusiveStartKey: { id: mockItem.id },
    } as const satisfies ClientWrapperQueryInput;

    test(`creates a QueryCommand and returns mocked "Items" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mockItems
      mockDdbClient.on(QueryCommand).resolvesOnce({
        Items: mockItemsMarshalled,
        LastEvaluatedKey: { id: { S: "LAST_EVAL_KEY" } },
      });

      const result = await mockDdbClientWrapper.query(queryValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        Items: mockItems,
        LastEvaluatedKey: { id: "LAST_EVAL_KEY" },
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(QueryCommand, {
        TableName: mockTableName,
        KeyConditionExpression: queryValidInput.KeyConditionExpression,
        ExpressionAttributeNames: queryValidInput.ExpressionAttributeNames,
        ExpressionAttributeValues: mockDdbClientWrapper.marshall(
          queryValidInput.ExpressionAttributeValues
        ),
        ExclusiveStartKey: mockDdbClientWrapper.marshall(queryValidInput.ExclusiveStartKey),
      });
    });

    test(`returns undefined "Items" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.query(queryValidInput);
      expect(result.Items).toBeUndefined();
    });

    test(`throws when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.query(null as any)).rejects.toThrowError();
    });
  });

  describe("scan()", () => {
    // Valid Scan input:
    const scanValidInput = {
      ExclusiveStartKey: { id: mockItem.id },
      ExpressionAttributeValues: { ":id": mockItem.id },
    } as const satisfies ClientWrapperScanInput;

    test(`creates a ScanCommand and returns mocked "Items" when called with valid arguments`, async () => {
      // Arrange mock ddbClient returned values
      mockDdbClient.on(ScanCommand).resolvesOnce({
        Items: mockItems.map((item) => mockDdbClientWrapper.marshall(item)),
        LastEvaluatedKey: { id: { S: "LAST_EVAL_KEY" } },
      });

      const result = await mockDdbClientWrapper.scan(scanValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        Items: mockItems,
        LastEvaluatedKey: { id: "LAST_EVAL_KEY" },
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(ScanCommand, {
        TableName: mockTableName,
        ExclusiveStartKey: mockDdbClientWrapper.marshall(scanValidInput.ExclusiveStartKey),
        ExpressionAttributeValues: mockDdbClientWrapper.marshall(
          scanValidInput.ExpressionAttributeValues
        ),
      });
    });

    test(`returns undefined "Items" when nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.scan();
      expect(result.Items).toBeUndefined();
    });

    test(`throws when called with invalid arguments`, async () => {
      await expect(mockDdbClientWrapper.scan(null as any)).rejects.toThrowError();
    });
  });

  describe("transactWriteItems()", () => {
    // Valid TransactWriteItem input:
    const transactWriteItemValidInput = {
      TransactItems: [
        {
          ConditionCheck: {
            Key: { id: mockItem.id },
            ConditionExpression: "#id = :id",
            ExpressionAttributeNames: { "#id": "id" },
            ExpressionAttributeValues: { ":id": mockItem.id },
          },
        },
        {
          Put: {
            Item: mockItem,
            ExpressionAttributeValues: { ":id": mockItem.id },
          },
        },
        {
          Update: {
            Key: { id: mockItem.id },
            UpdateExpression: "SET #name = :name",
            ExpressionAttributeNames: { "#name": "name" },
            ExpressionAttributeValues: { ":name": "updated_name" },
          },
        },
        {
          Delete: {
            Key: { id: mockItem.id },
            ExpressionAttributeValues: { ":id": mockItem.id },
          },
        },
      ],
    } as const satisfies ClientWrapperTransactWriteItemsInput;

    const mockConditionCheck = transactWriteItemValidInput.TransactItems[0].ConditionCheck;
    const mockPut = transactWriteItemValidInput.TransactItems[1].Put;
    const mockUpdate = transactWriteItemValidInput.TransactItems[2].Update;
    const mockDelete = transactWriteItemValidInput.TransactItems[3].Delete;

    test(`creates a TransactWriteCommand and returns mocked "ConsumedCapacity" when called with valid arguments`, async () => {
      // Arrange mock ddbClient returned values
      mockDdbClient.on(TransactWriteItemsCommand).resolvesOnce({
        ItemCollectionMetrics: { [mockTableName]: [mockItemCollectionMetrics] },
        ConsumedCapacity: [{}],
      });

      const result = await mockDdbClientWrapper.transactWriteItems(transactWriteItemValidInput);

      // Assert the result
      expect(result).toStrictEqual({
        ItemCollectionMetrics: { [mockTableName]: [mockItemCollectionMetrics] },
        ConsumedCapacity: [{}],
      });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(TransactWriteItemsCommand, {
        TransactItems: [
          {
            ConditionCheck: {
              ...mockConditionCheck,
              TableName: mockTableName,
              Key: mockDdbClientWrapper.marshall(mockConditionCheck.Key),
              ExpressionAttributeValues: mockDdbClientWrapper.marshall(
                mockConditionCheck.ExpressionAttributeValues
              ),
            },
          },
          {
            Put: {
              ...mockPut,
              TableName: mockTableName,
              Item: mockItemMarshalled,
              ExpressionAttributeValues: mockDdbClientWrapper.marshall(
                mockPut.ExpressionAttributeValues
              ),
            },
          },
          {
            Update: {
              ...mockUpdate,
              TableName: mockTableName,
              Key: mockDdbClientWrapper.marshall(mockUpdate.Key),
              ExpressionAttributeValues: mockDdbClientWrapper.marshall(
                mockUpdate.ExpressionAttributeValues
              ),
            },
          },
          {
            Delete: {
              ...mockDelete,
              TableName: mockTableName,
              Key: mockDdbClientWrapper.marshall(mockDelete.Key),
              ExpressionAttributeValues: mockDdbClientWrapper.marshall(
                mockDelete.ExpressionAttributeValues
              ),
            },
          },
        ],
      });
    });
  });

  describe("describeTable()", () => {
    // Valid DescribeTable input:
    const describeTableValidInput = {
      TableName: mockTableName,
    } as const satisfies ClientWrapperDescribeTableInput;

    test(`creates a DescribeTableCommand and returns mocked "Table" when called with valid arguments`, async () => {
      // Arrange ddbClient to return a mock Table object
      mockDdbClient.on(DescribeTableCommand).resolvesOnce({ Table: { TableName: mockTableName } });

      const result = await mockDdbClientWrapper.describeTable(describeTableValidInput);

      // Assert the result
      expect(result.Table).toStrictEqual({ TableName: mockTableName });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(
        DescribeTableCommand,
        describeTableValidInput
      );
    });

    test(`returns undefined "Table" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.describeTable(describeTableValidInput);
      expect(result.Table).toBeUndefined();
    });
  });

  describe("createTable()", () => {
    // Valid CreateTable input:
    const createTableValidInput = {
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
    } as const satisfies ClientWrapperCreateTableInput;

    test(`creates a CreateTableCommand and returns mocked "TableDescription" when called with valid arguments`, async () => {
      // Arrange ddbClient to return a mock TableDescription
      mockDdbClient
        .on(CreateTableCommand)
        .resolvesOnce({ TableDescription: { TableName: mockTableName } });

      const result = await mockDdbClientWrapper.createTable(createTableValidInput);

      // Assert the result
      expect(result.TableDescription).toStrictEqual({ TableName: mockTableName });
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(CreateTableCommand, {
        TableName: mockTableName,
        ...createTableValidInput,
      });
    });

    test(`returns undefined "TableDescription" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.createTable(createTableValidInput);
      expect(result.TableDescription).toBeUndefined();
    });
  });

  describe("listTables()", () => {
    test(`creates a ListTablesCommand and returns mocked "TableNames" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mock TableNames
      const mockTableNames = [`${mockTableName}-1`, `${mockTableName}-2`];

      mockDdbClient.on(ListTablesCommand).resolvesOnce({ TableNames: mockTableNames });

      const result = await mockDdbClientWrapper.listTables();

      // Assert the result
      expect(result.TableNames).toStrictEqual(mockTableNames);
      // Assert the args provided to the SDK command
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(ListTablesCommand, {});
    });

    test(`returns undefined "TableNames" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.listTables();
      expect(result.TableNames).toBeUndefined();
    });
  });
});
