import { Table } from "./Table.js";
import { DdbSingleTableError } from "../utils/errors.js";
import type { TableCreateTableParameters } from "./types.js";

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

describe("table.ensureTableIsActive()", () => {
  // Since this fn uses timeouts, we need to use fake timers:
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers(); // reset timers after each test
  });

  test(`throws a timeout-related error when "waitForActive.timeout" has been exceeded`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    // This spy just advances the mock-timer to trigger the timeout.
    vi.spyOn(mockTable.ddbClient, "describeTable").mockImplementation(() => {
      vi.advanceTimersByTime(2000);
      return Promise.resolve({ Table: { TableStatus: "ACTIVE" as const } });
    });

    await expect(() => mockTable.ensureTableIsActive({ timeout: 1 })).rejects.toThrowError(
      /ensureTableIsActive has timed out/
    );

    // Assert that the table is still not active after the timeout:
    expect(mockTable.isTableActive).toBe(false);
  });

  test(`sets "isTableActive" to true if "describeTable" returns a "TableStatus" of "ACTIVE"`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const describeTableSpy = vi.spyOn(mockTable.ddbClient, "describeTable").mockResolvedValueOnce({
      Table: { TableStatus: "ACTIVE" },
    });

    const result = await mockTable.ensureTableIsActive();

    expect(result).toBeUndefined();
    expect(mockTable.isTableActive).toBe(true);
    expect(describeTableSpy).toHaveBeenCalled();
  });

  test(`throws a DdbConnectionError if "describeTable" throws an ECONNREFUSED error`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const describeTableSpy = vi
      .spyOn(mockTable.ddbClient, "describeTable")
      .mockRejectedValueOnce({ code: "ECONNREFUSED" });

    await expect(() => mockTable.ensureTableIsActive()).rejects.toThrowError(
      /Failed to connect to the provided DynamoDB endpoint/
    );

    expect(mockTable.isTableActive).toBe(false);
    expect(describeTableSpy).toHaveBeenCalled();
  });

  test(`re-throws any unknown/unexpected error that arises from the "describeTable" call`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const describeTableSpy = vi
      .spyOn(mockTable.ddbClient, "describeTable")
      .mockRejectedValueOnce("FOO_ERROR");

    await expect(() => mockTable.ensureTableIsActive()).rejects.toThrowError("FOO_ERROR");

    expect(mockTable.isTableActive).toBe(false);
    expect(describeTableSpy).toHaveBeenCalled();
  });

  test(`throws a DdbSingleTableError if "describeTable" throws a ResourceNotFoundException and "createIfNotExists" is false`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const describeTableSpy = vi.spyOn(mockTable.ddbClient, "describeTable").mockRejectedValueOnce({
      name: "ResourceNotFoundException",
    });

    await expect(() => mockTable.ensureTableIsActive()).rejects.toThrowError(DdbSingleTableError);

    expect(mockTable.isTableActive).toBe(false);
    expect(describeTableSpy).toHaveBeenCalled();
  });

  test(`creates a table and sets "isTableActive" to true even if "describeTable" must be called multiple times`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    let mockConnectionAttempts = 0;

    const spies = {
      describeTable: vi.spyOn(mockTable.ddbClient, "describeTable").mockImplementation(() => {
        mockConnectionAttempts++;
        vi.advanceTimersByTime(100);
        // Until the 3rd attempt, throw ResourceNotFoundException:
        if (mockConnectionAttempts < 3) throw { name: "ResourceNotFoundException" };
        // return "ACTIVE" on the 3rd attempt:
        return Promise.resolve({ Table: { TableStatus: "ACTIVE" as const } });
      }),
      createTable: vi.spyOn(mockTable.ddbClient, "createTable").mockResolvedValue({
        TableDescription: { TableStatus: "CREATING" },
      }),
    };

    await expect(
      mockTable.ensureTableIsActive({ createIfNotExists: true, frequency: 1 })
    ).resolves.toBeUndefined();

    expect(mockTable.isTableActive).toBe(true);
    expect(spies.describeTable).toHaveBeenCalledTimes(3); // <-- looped 3 times to call describeTable
    expect(spies.createTable).toHaveBeenCalledTimes(1);
  });

  test(`calls "createTable" with expected args and sets "isTableActive" to true when it returns a "TableStatus" of "ACTIVE"`, async () => {
    const mockTable = new Table({
      tableName: "MockTable",
      // Yes this is a weird schema - it's just for testing to ensure all
      // the createTableArgsFromSchema reducer logic works as expected.
      tableKeysSchema: {
        partitionKey: {
          type: "number",
          isHashKey: true,
          required: true,
          index: {
            name: "partitionKey_gsi",
            global: true,
            rangeKey: "sortKey",
            project: ["foo", "bar"],
            throughput: { read: 5, write: 5 },
          },
        },
        sortKey: {
          type: "Buffer",
          isRangeKey: true,
          required: true,
          index: {
            name: "sortKey_lsi",
            global: false,
            project: true,
          },
        },
        data: {
          type: "string",
          required: true,
          index: {
            name: "dataKey_lsi",
            global: false,
            // project not defined (same as false)
          },
        },
      },
    });

    const spies = {
      describeTable: vi.spyOn(mockTable.ddbClient, "describeTable").mockImplementation(() => {
        vi.advanceTimersByTime(100);
        throw { name: "ResourceNotFoundException" };
      }),
      createTable: vi.spyOn(mockTable.ddbClient, "createTable").mockResolvedValue({
        TableDescription: { TableStatus: "ACTIVE" },
      }),
    };

    const createTableInputs: TableCreateTableParameters = {
      BillingMode: "PROVISIONED",
      ProvisionedThroughput: {
        ReadCapacityUnits: 20,
        WriteCapacityUnits: 20,
      },
    };

    await expect(
      mockTable.ensureTableIsActive({ createIfNotExists: createTableInputs, frequency: 1 })
    ).resolves.toBeUndefined();

    expect(mockTable.isTableActive).toBe(true);
    expect(spies.describeTable).toHaveBeenCalledTimes(1);
    expect(spies.createTable).toHaveBeenCalledTimes(1);
    expect(spies.createTable).toHaveBeenCalledWith({
      TableName: "MockTable",
      ...createTableInputs,
      AttributeDefinitions: [
        { AttributeName: "partitionKey", AttributeType: "N" },
        { AttributeName: "sortKey", AttributeType: "B" },
        { AttributeName: "data", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "partitionKey", KeyType: "HASH" },
        { AttributeName: "sortKey", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "partitionKey_gsi",
          KeySchema: [
            { AttributeName: "partitionKey", KeyType: "HASH" },
            { AttributeName: "sortKey", KeyType: "RANGE" },
          ],
          Projection: {
            ProjectionType: "INCLUDE",
            NonKeyAttributes: ["foo", "bar"],
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      LocalSecondaryIndexes: [
        {
          IndexName: "sortKey_lsi",
          KeySchema: [{ AttributeName: "sortKey", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "dataKey_lsi",
          KeySchema: [{ AttributeName: "data", KeyType: "HASH" }],
          Projection: { ProjectionType: "KEYS_ONLY" },
        },
      ],
    });
  });
});
