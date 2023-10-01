import { Model } from "./Model";
import * as batchRequestsModule from "../BatchRequests";
import * as updateExpressionModule from "../Expressions/UpdateExpression";
import * as whereQueryModule from "../Expressions/WhereQuery";
import { Table } from "../Table";
import { ItemInputError } from "../utils";
import type { ItemTypeFromSchema } from "../types";

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

describe("Model", () => {
  // Mock Table instance:
  const mockTableName = "MockTable";
  const mockTable = new Table({
    tableName: mockTableName,
    tableKeysSchema: {
      pk: { type: "string", required: true, isHashKey: true },
      sk: {
        type: "string",
        required: true,
        isRangeKey: true,
        index: {
          name: "sk_gsi",
          rangeKey: "data",
          global: true,
          project: true,
          throughput: { read: 5, write: 5 },
        },
      },
      data: {
        type: "number",
        required: true,
        index: {
          name: "data_gsi",
          rangeKey: "sk",
          global: true,
          project: true,
          throughput: { read: 5, write: 5 },
        },
      },
    } as const,
    ddbClient: {
      region: "local",
      endpoint: "http://localhost:8000",
      credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
      },
    },
  });

  // Mock Model name:
  const mockModelName = "MockModel";

  // Mock Model schema:
  const mockModelSchema = mockTable.getModelSchema({
    pk: { alias: "id", type: "string", required: true },
    sk: { alias: "handle", type: "string", required: true },
    data: { type: "number", required: true },
    profile: {
      type: "map",
      required: true,
      schema: {
        displayName: { type: "string", required: true },
        photoUrl: { type: "string" },
      },
    },
    createdAt: { type: "Date", required: true, default: () => new Date() },
  } as const);

  type MockItem = ItemTypeFromSchema<typeof mockModelSchema>;

  // Mock Model instance:
  const mockModel = new Model(mockModelName, mockModelSchema, mockTable);

  // Assign var to _ddbDocClient "spy target" (private instance property, hence `as any`):
  const ddbDocClientSpyTarget = (mockModel.ddbClient as any)._ddbDocClient;

  // Mock items/keys for method inputs and defining expected results:
  const {
    mockItems,
    /** Mock items' keys for batch methods like `batchGetItems` which only use the items' keys */
    mockItemsKeys,
    /** Unaliased mock items for mocking resolved values of _ddbDocClient responses */
    unaliasedMockItems,
    unaliasedMockItemsKeys,
  } = [
    { id: "USER-1", handle: "@human_mcPerson", data: 1, profile: { displayName: "Human" } },
    { id: "USER-2", handle: "@canine_mcPup", data: 2, profile: { displayName: "Canine" } },
    { id: "USER-3", handle: "@foo_fooerson", data: 3, profile: { displayName: "Foo" } },
  ].reduce(
    (
      accum: {
        mockItems: Array<Omit<MockItem, "createdAt">>;
        mockItemsKeys: Array<Pick<MockItem, "id" | "handle">>;
        unaliasedMockItems: Array<{ pk: string; sk: string } & Pick<MockItem, "data" | "profile">>;
        unaliasedMockItemsKeys: Array<{ pk: string; sk: string }>;
      },
      baseMockItem
    ) => {
      const { id, handle, data, profile } = baseMockItem;
      const unaliasedKeys = { pk: id, sk: handle };
      const unaliasedItem = { ...unaliasedKeys, data, profile };
      accum.mockItems.push(baseMockItem);
      accum.mockItemsKeys.push({ id, handle });
      accum.unaliasedMockItems.push(unaliasedItem);
      accum.unaliasedMockItemsKeys.push(unaliasedKeys);
      return accum;
    },
    {
      mockItems: [],
      mockItemsKeys: [],
      unaliasedMockItems: [],
      unaliasedMockItemsKeys: [],
    }
  );

  // For single-item methods:
  const mockItem = mockItems[0];
  const mockItemKeys = mockItemsKeys[0];
  const unaliasedMockItem = unaliasedMockItems[0];
  const unaliasedMockItemKeys = unaliasedMockItemsKeys[0];

  describe("new Model()", () => {
    test("returns a Model instance with expected properties when provided valid arguments", () => {
      // Assert instance is of correct type and has expected property values:
      expect(mockModel).toBeInstanceOf(Model);
      expect(mockModel.modelName).toBe(mockModelName);
      expect(mockModel.schema).toStrictEqual(mockModelSchema);
      expect(mockModel.tableHashKey).toBe(mockTable.tableHashKey);
      expect(mockModel.tableRangeKey).toBe(mockTable.tableRangeKey);
      expect(mockModel.indexes).toStrictEqual(mockTable.indexes);
      expect(mockModel.ddbClient).toStrictEqual(mockTable.ddbClient);
      expect(mockModel.schemaOptions.allowUnknownAttributes).toBe(false);
    });
  });

  describe("Model.getItem()", () => {
    test(`calls IO-Actions and "ddbClient.getItem" and returns mockItem when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return unaliasedMockItem
      vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({ Item: unaliasedMockItem });

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        clientGetItem: vi.spyOn(mockModel.ddbClient, "getItem"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.getItem(mockItemKeys);

      // Assert the result
      expect(result).toStrictEqual(mockItem);

      // Assert `processKeyArgs` was called with `mockItemKeys` and returned `unaliasedMockItemKeys`
      expect(spies.processKeyArgs).toHaveBeenCalledOnce();
      expect(spies.processKeyArgs).toHaveBeenCalledWith(mockItemKeys);
      expect(spies.processKeyArgs).toHaveReturnedWith(unaliasedMockItemKeys);

      // Assert `getItem` was called with expected args
      expect(spies.clientGetItem).toHaveBeenCalledOnce();
      expect(spies.clientGetItem).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        Key: unaliasedMockItemKeys,
      });

      // Assert `processItemAttributes.fromDB` was called
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledOnce();
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledWith(unaliasedMockItem);
      expect(spies.processItemAttributesFromDB).toHaveReturnedWith(mockItem);
    });
    test(`returns undefined when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.getItem(mockItemKeys);
      expect(result).toBeUndefined();
    });
    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(() => mockModel.getItem({} as any)).rejects.toThrowError(/required .* "id"/i);
    });
  });

  describe("Model.batchGetItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchGetItems" and returns mockItems when called with valid arguments`, async () => {
      /*
        Arrange ddbDocClient to mock the following two responses:
          - First call:
            `Responses`:        includes all unaliasedMockItems except the first one
            `UnprocessedKeys`:  includes unaliasedMockItemsKeys[0]
          - Second call:
            `Responses`:        includes unaliasedMockItems[0]
            `UnprocessedKeys`:  <undefined>
      */
      vi.spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({
          Responses: { [mockTableName]: [...unaliasedMockItems].splice(1) },
          UnprocessedKeys: { [mockTableName]: { Keys: [unaliasedMockItemsKeys[0]] } },
        })
        .mockResolvedValueOnce({
          Responses: { [mockTableName]: [unaliasedMockItems[0]] },
        });

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        clientBatchGetItems: vi.spyOn(mockModel.ddbClient, "batchGetItems"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.batchGetItems(mockItemsKeys);

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual(expect.arrayContaining(mockItems));

      // Assert `processKeyArgs` was called for each keys object in `mockItemsKeys`
      expect(spies.processKeyArgs).toHaveBeenCalledTimes(mockItemsKeys.length);

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledOnce();
      expect(spies.handleBatchRequests.mock.calls[0]).toStrictEqual([
        expect.any(Function), // <-- submitBatchGetItemRequest
        unaliasedMockItemsKeys,
        100, // <-- chunkSize
        undefined, // <-- optional exponentialBackoffConfigs
      ]);

      // Assert `batchGetItems` was called twice with expected args
      expect(spies.clientBatchGetItems).toHaveBeenCalledTimes(2);
      expect(spies.clientBatchGetItems).toHaveBeenNthCalledWith(1, {
        RequestItems: { [mockTableName]: { Keys: unaliasedMockItemsKeys } },
      });
      expect(spies.clientBatchGetItems).toHaveBeenNthCalledWith(2, {
        RequestItems: { [mockTableName]: { Keys: [unaliasedMockItemsKeys[0]] } },
      });

      // Assert `processItemAttributes.fromDB` was called
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledTimes(unaliasedMockItems.length);
      expect(spies.processItemAttributesFromDB.mock.calls.flat()).toStrictEqual(
        expect.arrayContaining(unaliasedMockItems)
      );
      expect(
        spies.processItemAttributesFromDB.mock.results.map(({ value }) => value as unknown)
      ).toStrictEqual(expect.arrayContaining(mockItems));
    });
    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.batchGetItems(mockItemsKeys);
      expect(result).toStrictEqual([]);
    });
    test(`throws an ItemInputError when called with an invalid "primaryKeys" argument`, async () => {
      await expect(() => mockModel.batchGetItems(null as any)).rejects.toThrowError(/primaryKeys/);
    });
    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      const invalidMockItemsKeys = [{ id: "USER-X" }, ...mockItemsKeys];
      await expect(() => mockModel.batchGetItems(invalidMockItemsKeys as any)).rejects.toThrowError(
        /required .* "handle"/i
      );
    });
  });

  describe("Model.createItem()", () => {
    /* The createItem method uses PutCommand, the ReturnValues for which can only be "NONE" or
    "ALL_OLD", so the DDB API won't ever return anything when PutCommand is used to create a new
    item. However, PutCommand can also be used to make updates to existing items, so to ensure
    the createItem method never overwrites an existing item, the function should always provide a
    `ConditionExpression` of `attribute_not_exists( <tableHashKey> )`. The following tests assess
    whether the method achieves these expected behaviors. */
    test(`calls IO-Actions and "ddbClient.putItem" with an "attribute_not_exists" ConditionExpression when called with valid arguments`, async () => {
      // Arrange spies
      const spies = {
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        clientPutItem: vi.spyOn(mockModel.ddbClient, "putItem"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.createItem(mockItem);

      // Assert the result
      expect(result).toStrictEqual({ ...mockItem, createdAt: expect.any(Date) });

      // Assert `processItemAttributes.toDB` was called with the `item` and `createdAt` key
      expect(spies.processItemAttributesToDB).toHaveBeenCalledOnce();
      expect(spies.processItemAttributesToDB).toHaveBeenCalledWith({
        ...mockItem,
        createdAt: expect.any(Date),
      });
      expect(spies.processItemAttributesToDB).toHaveReturnedWith({
        ...unaliasedMockItem,
        createdAt: expect.any(Number),
      });

      // Assert `putItem` was called with expected args
      expect(spies.clientPutItem).toHaveBeenCalledOnce();
      expect(spies.clientPutItem).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        Item: { ...unaliasedMockItem, createdAt: expect.any(Number) },
        ConditionExpression: "attribute_not_exists(pk)",
      });

      // Assert `processItemAttributes.fromDB` was called and returned the expected result
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledOnce();
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledWith({
        ...unaliasedMockItem,
        createdAt: expect.any(Number),
      });
      expect(spies.processItemAttributesFromDB).toHaveReturnedWith({
        ...mockItem,
        createdAt: expect.any(Date),
      });
    });
    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(() => mockModel.createItem({} as any)).rejects.toThrowError(
        /A value is required for MockModel property "id"/i
      );
    });
  });

  describe("Model.upsertItem()", () => {
    test(`calls IO-Actions and "ddbClient.putItem" when called with valid arguments`, async () => {
      // Arrange spies
      const spies = {
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        clientPutItem: vi.spyOn(mockModel.ddbClient, "putItem"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.upsertItem(mockItem);

      // Assert the result
      expect(result).toStrictEqual({ ...mockItem, createdAt: expect.any(Date) });

      // Assert `processItemAttributes.toDB` was called with the `item`
      expect(spies.processItemAttributesToDB).toHaveBeenCalledOnce();
      expect(spies.processItemAttributesToDB).toHaveBeenCalledWith(mockItem);
      expect(spies.processItemAttributesToDB).toHaveReturnedWith({
        ...unaliasedMockItem,
        createdAt: expect.any(Number),
      });

      // Assert `putItem` was called with expected args
      expect(spies.clientPutItem).toHaveBeenCalledOnce();
      expect(spies.clientPutItem).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        Item: { ...unaliasedMockItem, createdAt: expect.any(Number) },
      });

      // Assert `processItemAttributes.fromDB` was called and returned the expected result
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledOnce();
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledWith({
        ...unaliasedMockItem,
        createdAt: expect.any(Number),
      });
      expect(spies.processItemAttributesFromDB).toHaveReturnedWith({
        ...mockItem,
        createdAt: expect.any(Date),
      });
    });
    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(() => mockModel.upsertItem({} as any)).rejects.toThrowError(
        /A value is required for MockModel property "id"/i
      );
    });
  });

  describe("Model.batchUpsertItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchWriteItems" and returns "upsertItems" when called with valid arguments`, async () => {
      // Arrange expected BatchWriteItem PutRequest objects
      const expectedMockBatchWriteReqs = unaliasedMockItems.map((item) => ({
        PutRequest: { Item: { ...item, createdAt: expect.any(Number) } },
      }));

      /*
        Arrange ddbDocClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes unaliasedMockItems[0]
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      const unprocessedItem = unaliasedMockItems[0];

      vi.spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ UnprocessedItems: { [mockTableName]: [unprocessedItem] } })
        .mockResolvedValueOnce({});

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        clientBatchWriteItems: vi.spyOn(mockModel.ddbClient, "batchWriteItems"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.batchUpsertItems(mockItems);

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual(
        expect.arrayContaining(mockItems.map((item) => ({ ...item, createdAt: expect.any(Date) })))
      );

      // Assert `processKeyArgs` was not called
      expect(spies.processKeyArgs).not.toHaveBeenCalled();

      // Assert `processItemAttributes.toDB` was called
      expect(spies.processItemAttributesToDB).toHaveBeenCalledTimes(mockItems.length);

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledOnce();
      expect(spies.handleBatchRequests.mock.calls[0]).toStrictEqual([
        expect.any(Function), // <-- submitBatchWriteItemRequest
        expectedMockBatchWriteReqs,
        25, // <-- chunkSize
        undefined, // <-- optional exponentialBackoffConfigs
      ]);

      // Assert `batchWriteItems` was called twice with expected args
      expect(spies.clientBatchWriteItems).toHaveBeenCalledTimes(2);
      expect(spies.clientBatchWriteItems).toHaveBeenNthCalledWith(1, {
        RequestItems: { [mockTableName]: expectedMockBatchWriteReqs },
      });
      expect(spies.clientBatchWriteItems).toHaveBeenNthCalledWith(2, {
        RequestItems: { [mockTableName]: [unprocessedItem] },
      });

      // Assert `processItemAttributes.fromDB` args and returned values
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledTimes(
        expectedMockBatchWriteReqs.length
      );
    });
    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.batchUpsertItems([]);
      expect(result).toStrictEqual([]);
    });
    test(`throws an error when called with an invalid "items" argument`, async () => {
      await expect(() => mockModel.batchUpsertItems(null as any)).rejects.toThrow();
    });
  });

  describe("Model.updateItem()", () => {
    // Mock values shared by multiple `updateItem()` tests:
    const mockUpdatedHandle = "@NEW_HANDLE";
    const mockUpdatedItem = { ...mockItem, handle: mockUpdatedHandle };

    test(`calls IO-Actions and "ddbClient.updateItem" and returns updated mockItem when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return unaliasedMockItem with updated sk/handle
      vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({
        Attributes: { ...unaliasedMockItem, sk: mockUpdatedHandle },
      });

      // Arrange spies
      const spies = {
        clientUpdateItem: vi.spyOn(mockModel.ddbClient, "updateItem"),
      };

      const result = await mockModel.updateItem(mockItemKeys, {
        update: { handle: mockUpdatedHandle },
      });

      // Assert the result
      expect(result).toStrictEqual(mockUpdatedItem);

      // Assert `updateItem` was called with expected args
      expect(spies.clientUpdateItem).toHaveBeenCalledOnce();
      expect(spies.clientUpdateItem).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        Key: unaliasedMockItemKeys,
        UpdateExpression: "SET #sk = :sk",
        ExpressionAttributeNames: { "#sk": "sk" },
        ExpressionAttributeValues: { ":sk": mockUpdatedHandle },
        ReturnValues: "ALL_NEW",
      });
    });
  });

  describe("Model.deleteItem()", () => {
    test(`calls IO-Actions and "ddbClient.deleteItem" and returns item attributes when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return unaliasedMockItem
      vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({
        Attributes: unaliasedMockItem,
      });

      // Arrange spies
      const spies = {
        clientDeleteItem: vi.spyOn(mockModel.ddbClient, "deleteItem"),
      };

      const result = await mockModel.deleteItem(mockItemKeys);

      // Assert the result
      expect(result).toStrictEqual(mockItem);

      // Assert `deleteItem` was called with expected args
      expect(spies.clientDeleteItem).toHaveBeenCalledOnce();
      expect(spies.clientDeleteItem).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        Key: unaliasedMockItemKeys,
        ReturnValues: "ALL_OLD",
      });
    });
    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(() => mockModel.deleteItem({} as any)).rejects.toThrowError(/required .* "id"/i);
    });
  });

  describe("Model.batchDeleteItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchWriteItems" and returns "deleteItems" when called with valid arguments`, async () => {
      // Arrange BatchWriteItem request objects
      const expectedMockBatchWriteReqs = unaliasedMockItemsKeys.map((keys) => ({
        DeleteRequest: { Key: keys },
      }));

      /*
        Arrange ddbDocClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes unaliasedMockItems[0]
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      const unprocessedItem = unaliasedMockItems[0];

      vi.spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ UnprocessedItems: { [mockTableName]: [unprocessedItem] } })
        .mockResolvedValueOnce({});

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        clientBatchWriteItems: vi.spyOn(mockModel.ddbClient, "batchWriteItems"),
      };

      const result = await mockModel.batchDeleteItems(mockItemsKeys);

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual(expect.arrayContaining(mockItemsKeys));

      // Assert `processKeyArgs` was called
      expect(spies.processKeyArgs).toHaveBeenCalledTimes(mockItemsKeys.length);

      // Assert `processItemAttributes.toDB` was not called
      expect(spies.processItemAttributesToDB).not.toHaveBeenCalled();

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledOnce();
      expect(spies.handleBatchRequests.mock.calls[0]).toStrictEqual([
        expect.any(Function), // <-- submitBatchWriteItemRequest
        expectedMockBatchWriteReqs,
        25, // <-- chunkSize
        undefined, // <-- optional exponentialBackoffConfigs
      ]);

      // Assert `batchGetItems` was called twice with expected args
      expect(spies.clientBatchWriteItems).toHaveBeenCalledTimes(2);
      expect(spies.clientBatchWriteItems).toHaveBeenNthCalledWith(1, {
        RequestItems: { [mockTableName]: expectedMockBatchWriteReqs },
      });
      expect(spies.clientBatchWriteItems).toHaveBeenNthCalledWith(2, {
        RequestItems: { [mockTableName]: [unprocessedItem] },
      });
    });
    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.batchDeleteItems([]);
      expect(result).toStrictEqual([]);
    });
    test(`throws an error when called with an invalid "primaryKeys" argument`, async () => {
      await expect(() => mockModel.batchDeleteItems(null as any)).rejects.toThrow();
    });
  });

  describe("Model.batchUpsertAndDeleteItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchWriteItems" and returns "upsertItems" when called with valid arguments`, async () => {
      // Arrange BatchWriteItem request objects
      const expectedMockBatchWriteReqs = [
        ...unaliasedMockItems.map((item) => ({
          PutRequest: { Item: { ...item, createdAt: expect.any(Number) } },
        })),
        ...unaliasedMockItemsKeys.map((keys) => ({ DeleteRequest: { Key: keys } })),
      ];

      /*
        Arrange ddbDocClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes unaliasedMockItems[0]
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      const unprocessedItem = {
        ...unaliasedMockItems[0],
        createdAt: Math.floor(new Date().getTime() / 1000),
      };

      vi.spyOn(ddbDocClientSpyTarget, "send")
        .mockResolvedValueOnce({ UnprocessedItems: { [mockTableName]: [unprocessedItem] } })
        .mockResolvedValueOnce({});

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        clientBatchWriteItems: vi.spyOn(mockModel.ddbClient, "batchWriteItems"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.batchUpsertAndDeleteItems({
        upsertItems: mockItems,
        deleteItems: mockItemsKeys,
      });

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual({
        upsertItems: expect.arrayContaining(
          mockItems.map((item) => ({ ...item, createdAt: expect.any(Date) }))
        ),
        deleteItems: expect.arrayContaining(mockItemsKeys),
      });

      // Assert `processKeyArgs` was called
      expect(spies.processKeyArgs).toHaveBeenCalledTimes(mockItemsKeys.length);

      // Assert `processItemAttributes.toDB` was called
      expect(spies.processItemAttributesToDB).toHaveBeenCalledTimes(mockItems.length);

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledOnce();
      expect(spies.handleBatchRequests.mock.calls[0]).toStrictEqual([
        expect.any(Function), // <-- submitBatchWriteItemRequest
        expectedMockBatchWriteReqs,
        25, // <-- chunkSize
        undefined, // <-- optional exponentialBackoffConfigs
      ]);

      // Assert `batchGetItems` was called twice with expected args
      expect(spies.clientBatchWriteItems).toHaveBeenCalledTimes(2);
      expect(spies.clientBatchWriteItems).toHaveBeenNthCalledWith(1, {
        RequestItems: { [mockTableName]: expectedMockBatchWriteReqs },
      });
      expect(spies.clientBatchWriteItems).toHaveBeenNthCalledWith(2, {
        RequestItems: { [mockTableName]: [unprocessedItem] },
      });

      // Assert `processItemAttributes.fromDB` args and returned values
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledTimes(unaliasedMockItems.length);
    });
    test(`returns empty arrays when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.batchUpsertAndDeleteItems({
        upsertItems: [],
        deleteItems: [],
      });
      expect(result).toStrictEqual({ upsertItems: [], deleteItems: [] });
    });
    test(`throws an error when called with an invalid argument`, async () => {
      await expect(() => mockModel.batchUpsertAndDeleteItems({})).rejects.toThrow();
    });
  });

  describe("Model.query()", () => {
    test(`calls IO-Actions and "ddbClient.query" when called with valid WhereQuery arguments`, async () => {
      // Arrange ddbDocClient to return unaliasedMockItem
      vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({ Items: [unaliasedMockItem] });

      // Arrange spies
      const spies = {
        whereQuery: vi.spyOn(whereQueryModule, "convertWhereQueryToSdkQueryArgs"),
        clientQuery: vi.spyOn(mockModel.ddbClient, "query"),
      };

      const result = await mockModel.query({
        where: {
          handle: mockItem.handle,
          data: { lt: 2 },
        },
        limit: 1,
      });

      // Assert the result
      expect(result).toStrictEqual([mockItem]);

      // Assert WhereQuery fn args and returned values
      expect(spies.whereQuery).toHaveBeenCalledOnce();
      expect(spies.whereQuery).toHaveBeenCalledWith({
        where: {
          sk: mockItem.handle,
          data: { lt: 2 },
        },
      });

      // Assert the ddbClient.query args
      expect(spies.clientQuery).toHaveBeenCalledOnce();
      expect(spies.clientQuery).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        KeyConditionExpression: "#sk = :sk AND #data < :data",
        ExpressionAttributeNames: { "#sk": "sk", "#data": "data" },
        ExpressionAttributeValues: { ":sk": mockItem.handle, ":data": 2 },
        IndexName: "sk_gsi",
        Limit: 1,
      });
    });
    test(`does not call WhereQuery fn when called with an explicit KeyConditionExpression`, async () => {
      // Arrange ddbDocClient to return unaliasedMockItem
      vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({ Items: [unaliasedMockItem] });

      // Arrange spies
      const spies = {
        whereQuery: vi.spyOn(whereQueryModule, "convertWhereQueryToSdkQueryArgs"),
        clientQuery: vi.spyOn(mockModel.ddbClient, "query"),
      };

      const result = await mockModel.query({
        KeyConditionExpression: "#sk = :sk AND #data < :data",
        ExpressionAttributeNames: { "#sk": "sk", "#data": "data" },
        ExpressionAttributeValues: { ":sk": mockItem.handle, ":data": 2 },
        IndexName: "sk_gsi",
        Limit: 1,
      });

      // Assert the result
      expect(result).toStrictEqual([mockItem]);

      // Assert WhereQuery fn args and returned values
      expect(spies.whereQuery).not.toHaveBeenCalled();

      // Assert the ddbClient.query args
      expect(spies.clientQuery).toHaveBeenCalledOnce();
      expect(spies.clientQuery).toHaveBeenCalledWith({
        TableName: mockTable.tableName,
        KeyConditionExpression: "#sk = :sk AND #data < :data",
        ExpressionAttributeNames: { "#sk": "sk", "#data": "data" },
        ExpressionAttributeValues: { ":sk": mockItem.handle, ":data": 2 },
        IndexName: "sk_gsi",
        Limit: 1,
      });
    });
    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.query({ KeyConditionExpression: "foo = foo" });
      expect(result).toStrictEqual([]);
    });
  });

  describe("Model.scan()", () => {
    test(`calls IO-Actions and "ddbClient.scan" when called with valid arguments`, async () => {
      // Arrange ddbDocClient to return unaliasedMockItems
      vi.spyOn(ddbDocClientSpyTarget, "send").mockResolvedValueOnce({ Items: unaliasedMockItems });

      // Arrange spies
      const spies = {
        clientScan: vi.spyOn(mockModel.ddbClient, "scan"),
      };

      const result = await mockModel.scan();

      // Assert the result
      expect(result).toStrictEqual(mockItems);

      // Assert the ddbClient.scan args
      expect(spies.clientScan).toHaveBeenCalledOnce();
      expect(spies.clientScan).toHaveBeenCalledWith({ TableName: mockTable.tableName });
    });
    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.scan();
      expect(result).toStrictEqual([]);
    });
  });
});
