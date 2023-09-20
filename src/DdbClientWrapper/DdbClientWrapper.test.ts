import {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  BatchGetCommand,
  PutCommand,
  BatchWriteCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { DdbClientWrapper } from "./DdbClientWrapper";
import type { DdbClientWrapperCtorParams } from "./types";

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

describe("DdbClientWrapper", () => {
  // Mock DdbClientWrapper inputs:
  const mockTableName = "MockTable";
  const mockClassCtorInputs: DdbClientWrapperCtorParams = {
    ddbClientConfigs: {
      region: "local",
      endpoint: "http://localhost:8000",
      credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
      },
    },
  };

  // Mock DdbClientWrapper:
  const mockDdbClientWrapper = new DdbClientWrapper(mockClassCtorInputs);

  // Assign vars to common "spy targets" which are private instance properties (hence `as any`):
  const ddbClientSpyTarget = (mockDdbClientWrapper as any)._ddbClient;
  const ddbDocClientSpyTarget = (mockDdbClientWrapper as any)._ddbDocClient;

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

  describe("new DdbClientWrapper()", () => {
    test("returns a valid DdbClientWrapper instance when called with valid arguments", () => {
      // Assert instance is of correct type:
      expect(mockDdbClientWrapper).toBeInstanceOf(DdbClientWrapper);
    });
  });

  describe("DdbClientWrapper.getItem()", () => {
    // Valid GetItem input:
    const getItemValidInput = {
      TableName: mockTableName,
      Key: { id: mockItem.id },
    };

    test(`creates a GetCommand and returns mocked "Item" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return mockItem (ddbDocClient is a private field, hence the `as any`)
      const ddbDocClientSpy = vi
        .spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ Item: mockItem });

      const result = await mockDdbClientWrapper.getItem(getItemValidInput);

      // Assert the result
      expect(result?.Item).toStrictEqual(mockItem);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(GetCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(getItemValidInput);
    });
    test(`returns undefined "Item" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.getItem(getItemValidInput);
      expect(result?.Item).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.getItem(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.batchGetItems()", () => {
    // Valid BatchGetItem input:
    const batchGetItemValidInput = {
      RequestItems: {
        [mockTableName]: {
          Keys: mockItemsKeys,
        },
      },
    };

    test(`creates a BatchGetCommand and returns mocked "Responses" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return mockItems
      const ddbDocClientSpy = vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({
        Responses: {
          [mockTableName]: mockItems,
        },
      });

      const result = await mockDdbClientWrapper.batchGetItems(batchGetItemValidInput);

      // Assert the result
      expect(result?.Responses?.[mockTableName]).toStrictEqual(mockItems);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(BatchGetCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(batchGetItemValidInput);
    });
    test(`returns undefined "Responses" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.batchGetItems(batchGetItemValidInput);
      expect(result?.Responses).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.batchGetItems(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.putItem()", () => {
    // Valid PutItem input:
    const putItemValidInput = {
      TableName: mockTableName,
      Item: mockItem,
    };

    test(`creates a PutCommand and returns mocked "Attributes" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return mockItem
      const ddbDocClientSpy = vi
        .spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ Attributes: mockItem });

      const result = await mockDdbClientWrapper.putItem(putItemValidInput);

      // Assert the result
      expect(result?.Attributes).toStrictEqual(mockItem);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(PutCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(putItemValidInput);
    });
    test(`returns undefined "Attributes" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.putItem(putItemValidInput);
      expect(result?.Attributes).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.putItem(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.updateItem()", () => {
    // Mock values shared by multiple `updateItem()` tests:
    const mockUpdatedName = "NEW_NAME";
    const mockUpdatedItem = { ...mockItem, name: mockUpdatedName };

    // Valid UpdateItem input:
    const updateItemValidInput = {
      TableName: mockTableName,
      Key: { id: mockItem.id },
      UpdateExpression: "SET #name = :name",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":name": mockUpdatedName },
      ReturnValues: "ALL_NEW",
    };

    test(`creates an UpdateCommand and returns mocked "Attributes" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return mockItem with updated "name"
      const ddbDocClientSpy = vi
        .spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ Attributes: mockUpdatedItem });

      const result = await mockDdbClientWrapper.updateItem(updateItemValidInput);

      // Assert the result
      expect(result?.Attributes).toStrictEqual(mockUpdatedItem);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(UpdateCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(updateItemValidInput);
    });
    test(`returns undefined "Attributes" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.updateItem(updateItemValidInput);
      expect(result?.Attributes).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.updateItem(updateItemValidInput);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.deleteItem()", () => {
    // Valid DeleteItem input:
    const deleteItemValidInput = {
      TableName: mockTableName,
      Key: { id: mockItem.id },
    };

    test(`creates a DeleteCommand and returns mocked "Attributes" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return mockItem
      const ddbDocClientSpy = vi
        .spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ Attributes: mockItem });

      const result = await mockDdbClientWrapper.deleteItem(deleteItemValidInput);

      // Assert the result
      expect(result?.Attributes).toStrictEqual(mockItem);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(DeleteCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(deleteItemValidInput);
    });
    test(`returns undefined "Attributes" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.deleteItem(deleteItemValidInput);
      expect(result?.Attributes).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.deleteItem(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.batchWriteItems()", () => {
    // mockItems as BatchWriteItem PutRequest objects:
    const mockBatchWriteRequests = mockItems.map((itemObj) => ({ PutRequest: { Item: itemObj } }));

    // Valid BatchWriteItem input:
    const batchWriteItemValidInput = {
      RequestItems: {
        [mockTableName]: mockBatchWriteRequests,
      },
    };

    test(`creates a BatchWriteCommand and returns mocked "UnprocessedItems" when called with valid arguments`, async () => {
      // Arrange ddbDocClient spy to be able to check the args provided to the SDK command
      const ddbDocClientSpy = vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({
        UnprocessedItems: mockBatchWriteRequests,
      });

      const result = await mockDdbClientWrapper.batchWriteItems(batchWriteItemValidInput);

      // Assert the result (will be undefined because nothing is returned)
      expect(result?.UnprocessedItems).toStrictEqual(mockBatchWriteRequests);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(BatchWriteCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(batchWriteItemValidInput);
    });
    test(`returns undefined when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.batchWriteItems(batchWriteItemValidInput);
      expect(result).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.batchWriteItems(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.query()", () => {
    // Valid Query input:
    const queryValidInput = {
      TableName: mockTableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": "pk" },
      ExpressionAttributeValues: { ":pk": mockItem.id },
    };

    test(`creates a QueryCommand and returns mocked "Items" when called with valid arguments`, async () => {
      // Arrange spies for ddbDocClient and the WhereQuery-converter fn
      const spies = {
        ddbDocClient: vi
          .spyOn(ddbDocClientSpyTarget, "send")
          .mockResolvedValueOnce({ Items: mockItems }),
      };

      const result = await mockDdbClientWrapper.query(queryValidInput);

      // Assert the result
      expect(result?.Items).toStrictEqual(mockItems);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = spies.ddbDocClient.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(QueryCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(queryValidInput);
    });
    test(`returns undefined "Items" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.query(queryValidInput);
      expect(result?.Items).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.query(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.scan()", () => {
    // Valid Scan input:
    const scanValidInput = {
      TableName: mockTableName,
    };

    test(`creates a ScanCommand and returns mocked "Items" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return mockItems
      const ddbDocClientSpy = vi
        .spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ Items: mockItems });

      const result = await mockDdbClientWrapper.scan(scanValidInput);

      // Assert the result
      expect(result?.Items).toStrictEqual(mockItems);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbDocClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(ScanCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(scanValidInput);
    });
    test(`returns undefined "Items" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.scan(scanValidInput);
      expect(result?.Items).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.scan(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.describeTable()", () => {
    // Valid DescribeTable input:
    const describeTableValidInput = {
      TableName: mockTableName,
    };

    test(`creates a DescribeTableCommand and returns mocked "Table" when called with valid arguments`, async () => {
      // Arrange ddbClient to return a mock Table object
      const ddbClientSpy = vi
        .spyOn(ddbClientSpyTarget, "send")
        .mockResolvedValueOnce({ Table: { TableName: mockTableName } });

      const result = await mockDdbClientWrapper.describeTable(describeTableValidInput);

      // Assert the result
      expect(result?.Table).toStrictEqual({ TableName: mockTableName });
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(DescribeTableCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(describeTableValidInput);
    });
    test(`returns undefined "Table" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.describeTable(describeTableValidInput);
      expect(result?.Table).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.describeTable(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.createTable()", () => {
    // Valid CreateTable input:
    const createTableValidInput = {
      TableName: mockTableName,
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
    };

    test(`creates a CreateTableCommand and returns mocked "TableDescription" when called with valid arguments`, async () => {
      // Arrange ddbClient to return a mock TableDescription
      const ddbClientSpy = vi
        .spyOn(ddbClientSpyTarget, "send")
        .mockResolvedValueOnce({ TableDescription: { TableName: mockTableName } });

      const result = await mockDdbClientWrapper.createTable(createTableValidInput);

      // Assert the result
      expect(result?.TableDescription).toStrictEqual({ TableName: mockTableName });
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(CreateTableCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual(createTableValidInput);
    });
    test(`returns undefined "TableDescription" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.createTable(createTableValidInput);
      expect(result?.TableDescription).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.createTable(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("DdbClientWrapper.listTables()", () => {
    test(`creates a ListTablesCommand and returns mocked "TableNames" when called with valid arguments`, async () => {
      // Arrange ddbClient to return mock TableNames
      const mockTableNames = [`${mockTableName}-1`, `${mockTableName}-2`];

      const ddbClientSpy = vi
        .spyOn(ddbClientSpyTarget, "send")
        .mockResolvedValueOnce({ TableNames: mockTableNames });

      const result = await mockDdbClientWrapper.listTables();

      // Assert the result
      expect(result?.TableNames).toStrictEqual(mockTableNames);
      // Assert the arg provided to the client's `send` method
      const sdkCommand = ddbClientSpy.mock.lastCall?.[0];
      expect(sdkCommand).toBeInstanceOf(ListTablesCommand);
      // Assert the args provided to the SDK command
      expect((sdkCommand as any)?.input).toStrictEqual({});
    });
    test(`returns undefined "TableNames" when called with valid arguments but nothing is returned`, async () => {
      const result = await mockDdbClientWrapper.listTables();
      expect(result?.TableNames).toBeUndefined();
    });
    test(`returns undefined and does not throw when called with invalid arguments`, async () => {
      const result = await mockDdbClientWrapper.listTables(null as any);
      expect(result).toBeUndefined();
    });
  });
});
