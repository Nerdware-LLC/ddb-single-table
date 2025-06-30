import {
  DynamoDBClient,
  GetItemCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  BatchStatementErrorCodeEnum as BatchErrorCode,
  type BatchStatementError,
} from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import * as batchRequestsModule from "../DdbClientWrapper/handleBatchRequests.js";
import * as whereQueryModule from "../Expressions/WhereQuery/index.js";
import { ModelSchema } from "../Schema/ModelSchema.js";
import { Table } from "../Table/Table.js";
import { isValidIso8601DatetimeString } from "../utils/index.js";
import { Model } from "./Model.js";
import type { BatchGetItemsOpts, BatchWriteItemsOpts } from "./types/index.js";
import type { UnmarshalledBatchWriteRequest } from "../DdbClientWrapper/types/index.js";
import type { ItemTypeFromSchema } from "../types/index.js";
import type { Except } from "type-fest";

describe("Model", () => {
  // MOCK Model INPUTS:

  const ddbClient = new DynamoDBClient({
    region: "local",
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "local",
      secretAccessKey: "local",
    },
  });

  const mockDdbClient = mockClient(ddbClient);

  const mockTableName: string = "MockTable";
  const mockTable = new Table({
    ddbClient,
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
    },
  });

  const mockModelName = "MockModel";

  const mockModelSchema = mockTable.getModelSchema({
    pk: { alias: "id", type: "string", required: true },
    sk: { alias: "handle", type: "string", required: true },
    data: { type: "number", required: true },
    profile: {
      type: "map",
      required: true,
      schema: {
        displayName: { type: "string", required: true },
        photoUrl: { type: "string", nullable: true },
      },
    },
    ...ModelSchema.TIMESTAMP_ATTRIBUTES,
  });

  type MockItem = ItemTypeFromSchema<typeof mockModelSchema>;
  type UnaliasedMockItem = ItemTypeFromSchema<typeof mockModelSchema, { aliasKeys: false }>;

  // Mock Model instance:
  const mockModel = new Model(mockModelName, mockModelSchema, {
    autoAddTimestamps: true,
    ...mockTable, // eslint-disable-line @typescript-eslint/no-misused-spread
  });

  // Arrange mockDdbClient to return an empty object by default:
  beforeEach(() => {
    mockDdbClient.reset();
    mockDdbClient.onAnyCommand().resolves({}); // Default response for all commands
  });

  // Mock items/keys for method inputs and defining expected results:
  const {
    mockItems,
    /** Mock items' keys for batch methods like `batchGetItems` which only use the items' keys */
    mockItemsKeys,
    /** Unaliased _marshalled_ mock items for mocking resolved values of ddb client responses */
    unaliasedMockItems,
    unaliasedMockItemsKeys,
  } = [
    { id: "USER-1", handle: "@human_mcPerson", data: 1, profile: { displayName: "Human" } },
    { id: "USER-2", handle: "@canine_mcPup", data: 2, profile: { displayName: "Canine" } },
    { id: "USER-3", handle: "@foo_fooerson", data: 3, profile: { displayName: "Foo" } },
  ].reduce<{
    mockItems: Array<Except<MockItem, "createdAt" | "updatedAt">>;
    mockItemsKeys: Array<Pick<MockItem, "id" | "handle">>;
    unaliasedMockItems: Array<Except<UnaliasedMockItem, "createdAt" | "updatedAt">>;
    unaliasedMockItemsKeys: Array<Pick<UnaliasedMockItem, "pk" | "sk">>;
  }>(
    (accum, baseMockItem) => {
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
      expect(mockModel.ddb).toStrictEqual(mockTable.ddb);
      expect(mockModel.schemaOptions.autoAddTimestamps).toBe(true);
      expect(mockModel.schemaOptions.allowUnknownAttributes).toBe(false);
    });
  });

  describe("model.getItem()", () => {
    test(`calls IO-Actions and "ddbClient.getItem" and returns mockItem when called with valid arguments`, async () => {
      // Arrange ddbClient to return unaliasedMockItem
      mockDdbClient
        .on(GetItemCommand)
        .resolvesOnce({ Item: mockModel.ddb.marshall(unaliasedMockItem) });

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        clientGetItem: vi.spyOn(mockModel.ddb, "getItem"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      const result = await mockModel.getItem(mockItemKeys);

      // Assert the result
      expect(result).toStrictEqual(mockItem);

      // Assert `processKeyArgs` was called with `mockItemKeys` and returned `unaliasedMockItemKeys`
      expect(spies.processKeyArgs).toHaveBeenCalledExactlyOnceWith(mockItemKeys);
      expect(spies.processKeyArgs).toHaveReturnedWith(unaliasedMockItemKeys);

      // Assert `getItem` was called with expected args
      expect(spies.clientGetItem).toHaveBeenCalledExactlyOnceWith({ Key: unaliasedMockItemKeys });

      // Assert `processItemAttributes.fromDB` was called
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledExactlyOnceWith(unaliasedMockItem);
      expect(spies.processItemAttributesFromDB).toHaveReturnedWith(mockItem);
    });

    test(`returns undefined when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.getItem(mockItemKeys);
      expect(result).toBeUndefined();
    });

    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(mockModel.getItem({} as MockItem)).rejects.toThrowError(/required .* "id"/i);
    });
  });

  describe("model.batchGetItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchGetItems" and returns mockItems when called with valid arguments`, async () => {
      /*
        Arrange ddbClient to mock the following three responses:
          - First call:         <throw retryable error>
          - Second call:
            `Responses`:        includes all unaliasedMockItems except the first one
            `UnprocessedKeys`:  includes unaliasedMockItemsKeys[0]
          - Third call:
            `Responses`:        includes unaliasedMockItems[0]
            `UnprocessedKeys`:  <undefined>
      */
      mockDdbClient
        .on(BatchGetItemCommand)
        .rejectsOnce({
          Code: BatchErrorCode.ProvisionedThroughputExceeded,
        } satisfies BatchStatementError)
        .resolvesOnce({
          Responses: {
            [mockTableName]: unaliasedMockItems
              .slice(1)
              .map((item) => mockModel.ddb.marshall(item)),
          },
          UnprocessedKeys: {
            [mockTableName]: {
              Keys: [mockModel.ddb.marshall(unaliasedMockItemsKeys[0])],
            },
          },
        })
        .resolvesOnce({
          Responses: {
            [mockTableName]: [mockModel.ddb.marshall(unaliasedMockItems[0])],
          },
        });

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        clientBatchGetItems: vi.spyOn(mockModel.ddb, "batchGetItems"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      // Arrange opts for `batchGetItems`
      const batchGetItemsOpts: BatchGetItemsOpts = {
        batchConfigs: {
          retryConfigs: { disableDelay: true },
        },
      };

      const result = await mockModel.batchGetItems(mockItemsKeys, batchGetItemsOpts);

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual(expect.arrayContaining(mockItems));

      // Assert `processKeyArgs` was called for each keys object in `mockItemsKeys`
      expect(spies.processKeyArgs).toHaveBeenCalledTimes(mockItemsKeys.length);

      // Assert `batchGetItems` was called once with expected args
      expect(spies.clientBatchGetItems).toHaveBeenCalledExactlyOnceWith({
        RequestItems: { [mockTableName]: { Keys: unaliasedMockItemsKeys } },
        batchConfigs: batchGetItemsOpts.batchConfigs,
      });

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledExactlyOnceWith(
        expect.any(Function), // <-- submitBatchGetItemRequest
        unaliasedMockItemsKeys.map((keys) => mockModel.ddb.marshall(keys)),
        { chunkSize: 100, ...batchGetItemsOpts.batchConfigs }
      );

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
      expect(result).toBeUndefined();
    });

    test(`throws an ItemInputError when called with an invalid "primaryKeys" argument`, async () => {
      await expect(mockModel.batchGetItems(null as any)).rejects.toThrowError(/primaryKeys/);
    });

    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      const invalidMockItemsKeys = [{ id: "USER-X" }, ...mockItemsKeys];
      await expect(mockModel.batchGetItems(invalidMockItemsKeys as any)).rejects.toThrowError(
        /required .* "handle"/i
      );
    });
  });

  describe("model.createItem()", () => {
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
        clientPutItem: vi.spyOn(mockModel.ddb, "putItem"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      // Arrange expected values
      const expectedMockItem = {
        ...mockItem,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const expectedUnaliasedMockItem = {
        ...unaliasedMockItem,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      const result = await mockModel.createItem(mockItem);

      // Assert the result
      expect(result).toStrictEqual(expectedMockItem);

      // Assert `processItemAttributes.toDB` was called with the `item` and `createdAt` key
      expect(spies.processItemAttributesToDB).toHaveBeenCalledExactlyOnceWith(expectedMockItem);
      expect(spies.processItemAttributesToDB).toHaveReturnedWith(expectedUnaliasedMockItem);

      // Assert `putItem` was called with expected args
      expect(spies.clientPutItem).toHaveBeenCalledExactlyOnceWith({
        Item: expectedUnaliasedMockItem,
        ConditionExpression: "attribute_not_exists(pk)",
      });

      // Assert `processItemAttributes.fromDB` was called and returned the expected result
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledExactlyOnceWith(expectedUnaliasedMockItem); // prettier-ignore
      expect(spies.processItemAttributesFromDB).toHaveReturnedWith(expectedMockItem);
    });

    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(mockModel.createItem({} as any)).rejects.toThrowError(
        /A value is required for MockModel property "id"/i
      );
    });
  });

  describe("model.upsertItem()", () => {
    test(`calls IO-Actions and "ddbClient.putItem" when called with valid arguments`, async () => {
      // Arrange spies
      const spies = {
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        clientPutItem: vi.spyOn(mockModel.ddb, "putItem"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      // Arrange expected values
      const expectedMockItem = {
        ...mockItem,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const expectedUnaliasedMockItem = {
        ...unaliasedMockItem,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      const result = await mockModel.upsertItem(mockItem);

      // Assert the result
      expect(result).toStrictEqual(expectedMockItem);

      // Assert `processItemAttributes.toDB` was called with the `item`
      expect(spies.processItemAttributesToDB).toHaveBeenCalledExactlyOnceWith(expectedMockItem);
      expect(spies.processItemAttributesToDB).toHaveReturnedWith(expectedUnaliasedMockItem);

      // Assert `putItem` was called with expected args
      expect(spies.clientPutItem).toHaveBeenCalledExactlyOnceWith({
        Item: expectedUnaliasedMockItem,
      });

      // Assert `processItemAttributes.fromDB` was called and returned the expected result
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledExactlyOnceWith(expectedUnaliasedMockItem); // prettier-ignore
      expect(spies.processItemAttributesFromDB).toHaveReturnedWith(expectedMockItem);
    });

    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(mockModel.upsertItem({} as any)).rejects.toThrowError(
        /A value is required for MockModel property "id"/i
      );
    });
  });

  describe("model.batchUpsertItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchWriteItems" and returns "upsertItems" when called with valid arguments`, async () => {
      // Arrange expected BatchWriteItem PutRequest objects
      const expectedMockBatchWriteReqs = unaliasedMockItems.map((item) => ({
        PutRequest: {
          Item: {
            ...item,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
      }));

      /*
        Arrange ddbClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes unaliasedMockItems[0]
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      const unprocessedItem = unaliasedMockItems[0];

      mockDdbClient
        .on(BatchWriteItemCommand)
        .resolvesOnce({
          UnprocessedItems: {
            [mockTableName]: [mockModel.ddb.marshallAndConvertDates(unprocessedItem)],
          },
        })
        .resolvesOnce({});

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        clientBatchWriteItems: vi.spyOn(mockModel.ddb, "batchWriteItems"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      // Arrange opts for `batchUpsertItems`
      const batchUpsertItemsOpts: BatchWriteItemsOpts = {
        batchConfigs: {
          retryConfigs: { disableDelay: true },
        },
      };

      const result = await mockModel.batchUpsertItems(mockItems, batchUpsertItemsOpts);

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual(
        expect.arrayContaining(
          mockItems.map((item) => ({
            ...item,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }))
        )
      );

      // Assert `processKeyArgs` was not called
      expect(spies.processKeyArgs).not.toHaveBeenCalled();

      // Assert `processItemAttributes.toDB` was called
      expect(spies.processItemAttributesToDB).toHaveBeenCalledTimes(mockItems.length);

      // Assert `batchWriteItems` was called with expected args
      expect(spies.clientBatchWriteItems).toHaveBeenCalledExactlyOnceWith({
        RequestItems: { [mockTableName]: expectedMockBatchWriteReqs },
        batchConfigs: batchUpsertItemsOpts.batchConfigs,
      });

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledExactlyOnceWith(
        expect.any(Function), // <-- submitBatchWriteItemRequest
        expectedMockBatchWriteReqs.map(
          ({
            PutRequest: {
              Item: { createdAt: _createdAt, updatedAt: _updatedAt, ...itemWithoutTimestamps },
            },
          }) => ({
            PutRequest: {
              Item: {
                ...mockModel.ddb.marshall(itemWithoutTimestamps),
                createdAt: { S: expect.toSatisfy(isValidIso8601DatetimeString) },
                updatedAt: { S: expect.toSatisfy(isValidIso8601DatetimeString) },
              },
            },
          })
        ),
        { chunkSize: 25, ...batchUpsertItemsOpts.batchConfigs }
      );

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
      await expect(mockModel.batchUpsertItems(null as any)).rejects.toThrowError();
    });
  });

  describe("model.updateItem()", () => {
    // Mock values shared by multiple `updateItem()` tests:
    const mockUpdatedHandle = "@NEW_HANDLE";
    const mockUpdatedItem = { ...mockItem, handle: mockUpdatedHandle };

    test(`calls IO-Actions and "ddbClient.updateItem" and returns updated mockItem when called with valid arguments`, async () => {
      // Arrange ddbClient to return unaliasedMockItem with updated sk/handle
      mockDdbClient.on(UpdateItemCommand).resolvesOnce({
        Attributes: mockModel.ddb.marshall({
          ...unaliasedMockItem,
          sk: mockUpdatedHandle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      // Arrange spies
      const spies = {
        clientUpdateItem: vi.spyOn(mockModel.ddb, "updateItem"),
      };

      const result = await mockModel.updateItem(mockItemKeys, {
        update: { handle: mockUpdatedHandle },
      });

      // Assert the result
      expect(result).toStrictEqual({
        ...mockUpdatedItem,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Assert `updateItem` was called with expected args
      expect(spies.clientUpdateItem).toHaveBeenCalledExactlyOnceWith({
        Key: unaliasedMockItemKeys,
        UpdateExpression: "SET #sk = :sk, #updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#sk": "sk", "#updatedAt": "updatedAt" },
        ExpressionAttributeValues: {
          ":sk": mockUpdatedHandle,
          ":updatedAt": expect.any(Date),
        },
        ReturnValues: "ALL_NEW",
      });
    });
  });

  describe("model.deleteItem()", () => {
    test(`calls IO-Actions and "ddbClient.deleteItem" and returns item attributes when called with valid arguments`, async () => {
      // Arrange ddbClient to return unaliasedMockItem
      mockDdbClient
        .on(DeleteItemCommand)
        .resolvesOnce({ Attributes: mockModel.ddb.marshall(unaliasedMockItem) });

      // Arrange spies
      const spies = {
        clientDeleteItem: vi.spyOn(mockModel.ddb, "deleteItem"),
      };

      const result = await mockModel.deleteItem(mockItemKeys);

      // Assert the result
      expect(result).toStrictEqual(mockItem);

      // Assert `deleteItem` was called with expected args
      expect(spies.clientDeleteItem).toHaveBeenCalledExactlyOnceWith({
        Key: unaliasedMockItemKeys,
        ReturnValues: "ALL_OLD",
      });
    });

    test(`throws an ItemInputError when called with a missing "required" key attribute`, async () => {
      await expect(mockModel.deleteItem({} as any)).rejects.toThrowError(/required .* "id"/i);
    });
  });

  describe("model.batchDeleteItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchWriteItems" and returns "deleteItems" when called with valid arguments`, async () => {
      // Arrange BatchWriteItem request objects
      const expectedMockBatchWriteReqs = unaliasedMockItemsKeys.map((keys) => ({
        DeleteRequest: { Key: keys },
      }));

      /*
        Arrange ddbClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes unaliasedMockItems[0]
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      const unprocessedItem = unaliasedMockItems[0];

      mockDdbClient
        .on(BatchWriteItemCommand)
        .resolvesOnce({
          UnprocessedItems: {
            [mockTableName]: [mockModel.ddb.marshallAndConvertDates(unprocessedItem)],
          },
        })
        .resolvesOnce({});

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        clientBatchWriteItems: vi.spyOn(mockModel.ddb, "batchWriteItems"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
      };

      // Arrange opts for `batchDeleteItems`
      const batchDeleteItemsOpts: BatchWriteItemsOpts = {
        batchConfigs: {
          retryConfigs: { disableDelay: true },
        },
      };

      const result = await mockModel.batchDeleteItems(mockItemsKeys, batchDeleteItemsOpts);

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual(expect.arrayContaining(mockItemsKeys));

      // Assert `processKeyArgs` was called
      expect(spies.processKeyArgs).toHaveBeenCalledTimes(mockItemsKeys.length);

      // Assert `processItemAttributes.toDB` was not called
      expect(spies.processItemAttributesToDB).not.toHaveBeenCalled();

      // Assert `batchGetItems` was called twice with expected args
      expect(spies.clientBatchWriteItems).toHaveBeenCalledExactlyOnceWith({
        RequestItems: { [mockTableName]: expectedMockBatchWriteReqs },
        batchConfigs: batchDeleteItemsOpts.batchConfigs,
      });

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledExactlyOnceWith(
        expect.any(Function), // <-- submitBatchWriteItemRequest
        expectedMockBatchWriteReqs.map(({ DeleteRequest: { Key } }) => ({
          DeleteRequest: {
            Key: mockModel.ddb.marshall(Key),
          },
        })),
        { chunkSize: 25, ...batchDeleteItemsOpts.batchConfigs }
      );
    });

    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.batchDeleteItems([]);
      expect(result).toStrictEqual([]);
    });

    test(`throws an error when called with an invalid "primaryKeys" argument`, async () => {
      await expect(mockModel.batchDeleteItems(null as any)).rejects.toThrow();
    });
  });

  describe("model.batchUpsertAndDeleteItems()", () => {
    test(`calls IO-Actions and "ddbClient.batchWriteItems" and returns "upsertItems" when called with valid arguments`, async () => {
      // Arrange BatchWriteItem request objects
      const expectedMockBatchWriteReqs: Array<UnmarshalledBatchWriteRequest> = [
        ...unaliasedMockItems.map((item) => ({
          PutRequest: {
            Item: {
              ...item,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            },
          },
        })),
        ...unaliasedMockItemsKeys.map((keys) => ({ DeleteRequest: { Key: keys } })),
      ];

      /*
        Arrange ddbClient to mock the following two responses:
          - First call:
            `UnprocessedItems`:  includes unaliasedMockItems[0]
          - Second call:
            `UnprocessedItems`:  <undefined>
      */
      const operationTimestamp = new Date();

      const unprocessedItem = {
        ...unaliasedMockItems[0],
        createdAt: operationTimestamp,
        updatedAt: operationTimestamp,
      };

      mockDdbClient
        .on(BatchWriteItemCommand)
        .resolvesOnce({
          UnprocessedItems: {
            [mockTableName]: [
              { PutRequest: { Item: mockModel.ddb.marshallAndConvertDates(unprocessedItem) } },
            ],
          },
        })
        .resolvesOnce({});

      // Arrange spies
      const spies = {
        processKeyArgs: vi.spyOn(mockModel as any, "processKeyArgs"),
        processItemAttributesToDB: vi.spyOn(mockModel.processItemAttributes, "toDB"),
        clientBatchWriteItems: vi.spyOn(mockModel.ddb, "batchWriteItems"),
        handleBatchRequests: vi.spyOn(batchRequestsModule, "handleBatchRequests"),
        processItemAttributesFromDB: vi.spyOn(mockModel.processItemAttributes, "fromDB"),
      };

      // Arrange opts for `batchUpsertAndDeleteItems`
      const batchUpsertAndDeleteItemsOpts: BatchWriteItemsOpts = {
        batchConfigs: {
          retryConfigs: { disableDelay: true },
        },
      };

      const result = await mockModel.batchUpsertAndDeleteItems(
        {
          upsertItems: mockItems,
          deleteItems: mockItemsKeys,
        },
        batchUpsertAndDeleteItemsOpts
      );

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual({
        upsertItems: expect.arrayContaining(
          mockItems.map((item) => ({
            ...item,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }))
        ),
        deleteItems: expect.arrayContaining(mockItemsKeys),
      });

      // Assert `processKeyArgs` was called
      expect(spies.processKeyArgs).toHaveBeenCalledTimes(mockItemsKeys.length);

      // Assert `processItemAttributes.toDB` was called
      expect(spies.processItemAttributesToDB).toHaveBeenCalledTimes(mockItems.length);

      // Assert `batchGetItems` was called twice with expected args
      expect(spies.clientBatchWriteItems).toHaveBeenCalledExactlyOnceWith({
        RequestItems: { [mockTableName]: expectedMockBatchWriteReqs },
        batchConfigs: batchUpsertAndDeleteItemsOpts.batchConfigs,
      });

      // Assert `handleBatchRequests` was called with expected args
      expect(spies.handleBatchRequests).toHaveBeenCalledExactlyOnceWith(
        expect.any(Function), // <-- submitBatchWriteItemRequest
        expectedMockBatchWriteReqs.map(({ PutRequest, DeleteRequest }) => ({
          ...(PutRequest && {
            PutRequest: {
              Item: {
                ...mockModel.ddb.marshall({
                  pk: PutRequest.Item.pk,
                  sk: PutRequest.Item.sk,
                  data: PutRequest.Item.data,
                  profile: PutRequest.Item.profile,
                }),
                createdAt: { S: expect.toSatisfy(isValidIso8601DatetimeString) },
                updatedAt: { S: expect.toSatisfy(isValidIso8601DatetimeString) },
              },
            },
          }),
          ...(DeleteRequest && {
            DeleteRequest: {
              Key: mockModel.ddb.marshall(DeleteRequest.Key),
            },
          }),
        })),
        { chunkSize: 25, ...batchUpsertAndDeleteItemsOpts.batchConfigs }
      );

      // Assert `processItemAttributes.fromDB` was called for each `upsertItem` and `deleteItem` (6 total)
      expect(spies.processItemAttributesFromDB).toHaveBeenCalledTimes(
        unaliasedMockItems.length + unaliasedMockItemsKeys.length
      );
    });

    test("returns only processed items when some items are left unprocessed", async () => {
      // Arrange to have one upsert and one delete unprocessed
      const operationTimestamp = new Date();

      const unprocessedItem = {
        ...unaliasedMockItems[0],
        createdAt: operationTimestamp,
        updatedAt: operationTimestamp,
      };

      // Arrange ddbClient to always return `UnprocessedItems` for this test
      mockDdbClient.on(BatchWriteItemCommand).resolves({
        UnprocessedItems: {
          [mockTableName]: [
            { PutRequest: { Item: mockModel.ddb.marshallAndConvertDates(unprocessedItem) } },
            { DeleteRequest: { Key: mockModel.ddb.marshall(unaliasedMockItemsKeys[0]) } },
          ],
        },
      });

      // Arrange opts for `batchUpsertAndDeleteItems`
      const batchUpsertAndDeleteItemsOpts: BatchWriteItemsOpts = {
        batchConfigs: {
          retryConfigs: { disableDelay: true, maxRetries: 0 }, // Disable retries for this test
        },
      };

      const result = await mockModel.batchUpsertAndDeleteItems(
        {
          upsertItems: mockItems,
          deleteItems: mockItemsKeys,
        },
        batchUpsertAndDeleteItemsOpts
      );

      // Assert the result (arrayContaining because the order of the items is not guaranteed)
      expect(result).toStrictEqual({
        upsertItems: expect.arrayContaining(
          // Exclude the unprocessed PutRequest's item:
          mockItems
            .filter((item) => item.id !== mockItems[0].id)
            .map((item) => ({ ...item, createdAt: expect.any(Date), updatedAt: expect.any(Date) }))
        ),
        deleteItems: expect.arrayContaining(
          // Exclude the unprocessed DeleteRequest's keys:
          mockItemsKeys.filter((keys) => keys.id !== mockItemsKeys[0].id)
        ),
      });
    });

    test(`returns empty arrays when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.batchUpsertAndDeleteItems({
        upsertItems: [],
        deleteItems: [],
      });
      expect(result).toStrictEqual({ upsertItems: [], deleteItems: [] });
    });

    test(`throws an error when called with an invalid argument`, async () => {
      await expect(mockModel.batchUpsertAndDeleteItems({})).rejects.toThrow();
    });
  });

  describe("model.query()", () => {
    test(`calls IO-Actions and "ddbClient.query" when called with valid WhereQuery arguments`, async () => {
      // Arrange ddbClient to return unaliasedMockItem
      mockDdbClient
        .on(QueryCommand)
        .resolvesOnce({ Items: [mockModel.ddb.marshall(unaliasedMockItem)] });

      // Arrange spies
      const spies = {
        whereQuery: vi.spyOn(whereQueryModule, "convertWhereQueryToSdkQueryArgs"),
        clientQuery: vi.spyOn(mockModel.ddb, "query"),
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
      expect(spies.whereQuery).toHaveBeenCalledExactlyOnceWith({
        where: {
          sk: mockItem.handle,
          data: { lt: 2 },
        },
      });

      // Assert the ddbClient.query args
      expect(spies.clientQuery).toHaveBeenCalledExactlyOnceWith({
        KeyConditionExpression: "#sk = :sk AND #data < :data",
        ExpressionAttributeNames: { "#sk": "sk", "#data": "data" },
        ExpressionAttributeValues: { ":sk": mockItem.handle, ":data": 2 },
        IndexName: "sk_gsi",
        Limit: 1,
      });
    });

    test(`does not call WhereQuery fn when called with an explicit KeyConditionExpression`, async () => {
      // Arrange ddbClient to return unaliasedMockItem
      mockDdbClient
        .on(QueryCommand)
        .resolvesOnce({ Items: [mockModel.ddb.marshall(unaliasedMockItem)] });

      // Arrange spies
      const spies = {
        whereQuery: vi.spyOn(whereQueryModule, "convertWhereQueryToSdkQueryArgs"),
        clientQuery: vi.spyOn(mockModel.ddb, "query"),
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
      expect(spies.clientQuery).toHaveBeenCalledExactlyOnceWith({
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

  describe("model.scan()", () => {
    test(`calls IO-Actions and "ddbClient.scan" when called with valid arguments`, async () => {
      // Arrange ddbClient to return unaliasedMockItems
      mockDdbClient
        .on(ScanCommand)
        .resolvesOnce({ Items: unaliasedMockItems.map((item) => mockModel.ddb.marshall(item)) });

      // Arrange spies
      const spies = {
        clientScan: vi.spyOn(mockModel.ddb, "scan"),
      };

      const result = await mockModel.scan();

      // Assert the result
      expect(result).toStrictEqual(mockItems);

      // Assert the ddbClient.scan args
      expect(spies.clientScan).toHaveBeenCalledExactlyOnceWith({});
    });

    test(`returns an empty array when called with valid arguments but nothing is returned`, async () => {
      const result = await mockModel.scan();
      expect(result).toStrictEqual([]);
    });
  });
});
