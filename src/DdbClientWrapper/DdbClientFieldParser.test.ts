import { DdbClientFieldParser } from "./DdbClientFieldParser.js";
import type { __MetadataBearer as MetadataBearer } from "@aws-sdk/client-dynamodb";

describe("DdbClientFieldParser", () => {
  // Arrange mock inputs:
  const tableName = "test-table";

  const parser = new DdbClientFieldParser({
    tableName,
    marshallingConfigs: {
      marshallOptions: { removeUndefinedValues: true },
      unmarshallOptions: { wrapNumbers: false },
    },
  });

  const mockKey = { id: "1" };
  const marshalledMockKey = { id: { S: "1" } };

  const mockItem = {
    id: "1",
    name: "test",
  };
  const marshalledMockItem = {
    id: { S: "1" },
    name: { S: "test" },
  };

  const mockDate = new Date();

  const mockItemWithDate = {
    ...mockItem,
    createdAt: mockDate,
  };
  const marshalledMockItemWithDate = {
    ...marshalledMockItem,
    createdAt: { S: mockDate.toISOString() },
  };

  const mockMetadata: MetadataBearer["$metadata"] = {
    httpStatusCode: 200,
    requestId: "mockRequestId",
    attempts: 1,
    totalRetryDelay: 0,
  };

  /////////////////////////////////////////////////////////////////////////////
  // MARSHALLING UTIL METHODS:

  describe("marshall()", () => {
    test("marshalls data correctly", () => {
      const result = parser.marshall({ ...mockItem, value: undefined });
      expect(result).toStrictEqual(marshalledMockItem);
    });
  });

  describe("unmarshall()", () => {
    test("unmarshalls data correctly", () => {
      const result = parser.unmarshall(marshalledMockItem);
      expect(result).toStrictEqual(mockItem);
    });
  });

  describe("marshallAndConvertDates()", () => {
    test("marshalls and converts dates correctly", () => {
      const result = parser.marshallAndConvertDates(mockItemWithDate);
      expect(result).toStrictEqual(marshalledMockItemWithDate);
    });
  });

  describe("unmarshallAndConvertDates()", () => {
    test("unmarshalls and converts dates correctly", () => {
      const result = parser.unmarshallAndConvertDates(marshalledMockItemWithDate);
      expect(result).toStrictEqual(mockItemWithDate);
    });
  });

  /////////////////////////////////////////////////////////////////////////////

  describe("prepCommandArgs()", () => {
    test("preps args for GetItemCommand", () => {
      const result = parser.prepCommandArgs({
        Key: mockKey,
      });
      expect(result).toStrictEqual({
        TableName: tableName,
        Key: marshalledMockKey,
      });
    });

    test("preps args for BatchGetItemCommand", () => {
      const result = parser.prepCommandArgs({
        RequestItems: { [tableName]: { Keys: [mockKey] } },
      });
      expect(result).toStrictEqual({
        RequestItems: { [tableName]: { Keys: [marshalledMockKey] } },
      });
    });

    test("preps args for PutItemCommand", () => {
      const result = parser.prepCommandArgs({
        Item: mockItem,
      });
      expect(result).toStrictEqual({
        TableName: tableName,
        Item: marshalledMockItem,
      });
    });

    test("preps args for UpdateItemCommand", () => {
      const result = parser.prepCommandArgs({
        Key: mockKey,
        ExpressionAttributeValues: { ":name": "new-name", ":updatedAt": mockDate },
      });
      expect(result).toStrictEqual({
        TableName: tableName,
        Key: marshalledMockKey,
        ExpressionAttributeValues: {
          ":name": { S: "new-name" },
          ":updatedAt": { S: mockDate.toISOString() },
        },
      });
    });

    test("preps args for DeleteItemCommand", () => {
      const result = parser.prepCommandArgs({
        Key: mockKey,
      });
      expect(result).toStrictEqual({
        TableName: tableName,
        Key: marshalledMockKey,
      });
    });

    test("preps args for BatchWriteItemCommand", () => {
      const result = parser.prepCommandArgs({
        RequestItems: {
          [tableName]: [
            { PutRequest: { Item: mockItem } },
            { DeleteRequest: { Key: mockKey } }, //
          ],
        },
      });
      expect(result).toStrictEqual({
        RequestItems: {
          [tableName]: [
            { PutRequest: { Item: marshalledMockItem } },
            { DeleteRequest: { Key: marshalledMockKey } },
          ],
        },
      });
    });

    test("preps args for QueryCommand", () => {
      const result = parser.prepCommandArgs({
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1", ":d": mockDate },
        ExclusiveStartKey: mockKey,
      });
      expect(result).toStrictEqual({
        TableName: tableName,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": { S: "1" }, ":d": { S: mockDate.toISOString() } },
        ExclusiveStartKey: marshalledMockKey,
      });
    });

    test("preps args for ScanCommand", () => {
      const result = parser.prepCommandArgs({
        ExclusiveStartKey: mockKey,
        ExpressionAttributeValues: { ":name": "test", ":d": mockDate },
      });
      expect(result).toStrictEqual({
        TableName: tableName,
        ExclusiveStartKey: marshalledMockKey,
        ExpressionAttributeValues: {
          ":name": { S: "test" },
          ":d": { S: mockDate.toISOString() },
        },
      });
    });

    test("preps args for TransactWriteItemsCommand", () => {
      const result = parser.prepCommandArgs({
        TransactItems: [
          { Put: { TableName: tableName, Item: mockItem } },
          { Delete: { TableName: tableName, Key: mockKey } },
          {
            Update: {
              TableName: tableName,
              Key: mockKey,
              UpdateExpression: "SET #d = :d",
              ExpressionAttributeNames: { "#d": "data" },
              ExpressionAttributeValues: { ":d": mockDate },
            },
          },
        ],
      });
      expect(result).toStrictEqual({
        TransactItems: [
          { Put: { TableName: tableName, Item: marshalledMockItem } },
          { Delete: { TableName: tableName, Key: marshalledMockKey } },
          {
            Update: {
              TableName: tableName,
              Key: marshalledMockKey,
              UpdateExpression: "SET #d = :d",
              ExpressionAttributeNames: { "#d": "data" },
              ExpressionAttributeValues: { ":d": { S: mockDate.toISOString() } },
            },
          },
        ],
      });
    });
  });

  /////////////////////////////////////////////////////////////////////////////

  describe("parseClientResponse()", () => {
    test("parses response from GetItemCommand", () => {
      const result = parser.parseClientResponse({
        Item: marshalledMockItem,
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Item: mockItem,
        $metadata: mockMetadata,
      });
    });

    test("parses response from BatchGetItemCommand", () => {
      const result = parser.parseClientResponse({
        Responses: { [tableName]: [marshalledMockItem] },
        UnprocessedKeys: { [tableName]: { Keys: [marshalledMockKey] } },
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Responses: { [tableName]: [mockItem] },
        UnprocessedKeys: { [tableName]: { Keys: [mockKey] } },
        $metadata: mockMetadata,
      });
    });

    test("parses response from PutItemCommand", () => {
      const result = parser.parseClientResponse({
        Attributes: marshalledMockItem,
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Attributes: mockItem,
        $metadata: mockMetadata,
      });
    });

    test("parses response from UpdateItemCommand", () => {
      const result = parser.parseClientResponse({
        Attributes: marshalledMockItem,
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Attributes: mockItem,
        $metadata: mockMetadata,
      });
    });

    test("parses response from DeleteItemCommand", () => {
      const result = parser.parseClientResponse({
        Attributes: marshalledMockItem,
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Attributes: mockItem,
        $metadata: mockMetadata,
      });
    });

    test("parses response from BatchWriteItemCommand", () => {
      const result = parser.parseClientResponse({
        UnprocessedItems: {
          [tableName]: [
            { PutRequest: { Item: marshalledMockItem } },
            { DeleteRequest: { Key: marshalledMockKey } },
          ],
        },
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        UnprocessedItems: {
          [tableName]: [
            { PutRequest: { Item: mockItem } },
            { DeleteRequest: { Key: mockKey } }, //
          ],
        },
        $metadata: mockMetadata,
      });
    });

    test("parses response from QueryCommand", () => {
      const result = parser.parseClientResponse({
        Items: [marshalledMockItem],
        LastEvaluatedKey: marshalledMockKey,
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Items: [mockItem],
        LastEvaluatedKey: mockKey,
        $metadata: mockMetadata,
      });
    });

    test("parses response from ScanCommand", () => {
      const result = parser.parseClientResponse({
        Items: [marshalledMockItem],
        LastEvaluatedKey: marshalledMockKey,
        $metadata: mockMetadata,
      });
      expect(result).toStrictEqual({
        Items: [mockItem],
        LastEvaluatedKey: mockKey,
        $metadata: mockMetadata,
      });
    });

    test("parses response from TransactWriteItemsCommand", () => {
      const result = parser.parseClientResponse({ $metadata: mockMetadata });
      expect(result).toStrictEqual({ $metadata: mockMetadata });
    });
  });
});
