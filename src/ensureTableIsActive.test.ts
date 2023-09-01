import { DdbSingleTable } from "./DdbSingleTable";
import { ensureTableIsActive } from "./ensureTableIsActive";

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

describe("ensureTableIsActive()", () => {
  // Since this fn uses timeouts, we need to use fake timers:
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers(); // reset timers after each test
  });

  it(`should immediately return if "waitForActive.enabled" is false`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
      waitForActive: { enabled: false },
    });

    const spy = vi.spyOn(table.ddbClient, "describeTable");
    const result = await ensureTableIsActive.call(table);
    expect(result).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it(`should immediately return if "isTableActive" is true`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    table.isTableActive = true;

    const spy = vi.spyOn(table.ddbClient, "describeTable");
    const result = await ensureTableIsActive.call(table);
    expect(result).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it(`should throw a timeout-related Error when "waitForActive.timeout" has been exceeded`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
      waitForActive: { enabled: true, timeout: 1 },
    });

    // This spy just advances the mock-timer to trigger the timeout.
    vi.spyOn(table.ddbClient, "describeTable").mockImplementation(() => {
      vi.advanceTimersByTime(1000);
      return { TableStatus: "" } as unknown as ReturnType<typeof table.ddbClient.describeTable>;
    });

    await expect(() => ensureTableIsActive.call(table)).rejects.toThrowError(
      /ensureTableIsActive has timed out/
    );

    expect(table.isTableActive).toBe(false);
  });

  it(`should set "isTableActive" to true if "describeTable" returns a "TableStatus" of "ACTIVE"`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const spy = vi.spyOn(table.ddbClient, "describeTable").mockResolvedValueOnce({
      TableStatus: "ACTIVE",
    });

    const result = await ensureTableIsActive.call(table);
    expect(result).toBeUndefined();
    expect(table.isTableActive).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it(`should throw a DdbConnectionError if "describeTable" throws an ECONNREFUSED error`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const spy = vi
      .spyOn(table.ddbClient, "describeTable")
      .mockRejectedValueOnce({ code: "ECONNREFUSED" });

    await expect(() => ensureTableIsActive.call(table)).rejects.toThrowError(
      "Failed to connect to the provided DynamoDB endpoint"
    );

    expect(table.isTableActive).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it(`should re-throw any unknown/unexpected error from "describeTable"`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const spy = vi.spyOn(table.ddbClient, "describeTable").mockRejectedValueOnce("FOO_ERROR");

    await expect(() => ensureTableIsActive.call(table)).rejects.toThrowError("FOO_ERROR");

    expect(table.isTableActive).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it(`should throw a DdbSingleTableError if "describeTable" throws ResourceNotFoundException and "createIfNotExists" is false`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
    });

    const spy = vi.spyOn(table.ddbClient, "describeTable").mockRejectedValueOnce({
      name: "ResourceNotFoundException",
    });

    await expect(() => ensureTableIsActive.call(table)).rejects.toThrowError(
      'Invalid tableConfigs: createIfNotExists is "false" and Table does not exist.'
    );

    expect(table.isTableActive).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it(`should throw a DdbSingleTableError if the table needs to be created, but the "index" values are invalid`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: {
          type: "string",
          isRangeKey: true,
          required: true,
          index: {} as any, // <-- should cause an error
        },
      },
      tableConfigs: {
        createIfNotExists: true,
      },
    });

    const spy = vi.spyOn(table.ddbClient, "describeTable").mockRejectedValueOnce({
      name: "ResourceNotFoundException",
    });

    await expect(() => ensureTableIsActive.call(table)).rejects.toThrowError(
      "Invalid keys schema: every index must have a name"
    );

    expect(table.isTableActive).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it(`should create a table and set "isTableActive" to true even if the user must wait less than "timeout" seconds for the table to become ACTIVE`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
      tableKeysSchema: {
        partitionKey: { type: "string", isHashKey: true, required: true },
        sortKey: { type: "string", isRangeKey: true, required: true },
      },
      waitForActive: { enabled: true, frequency: 1 },
      tableConfigs: {
        createIfNotExists: true,
      },
    });

    let mockConnectionAttempts = 0;

    const describeTableSpy = vi.spyOn(table.ddbClient, "describeTable").mockImplementation(() => {
      mockConnectionAttempts++;
      vi.advanceTimersByTime(100);

      // Until the 3rd attempt, throw ResourceNotFoundException:
      if (mockConnectionAttempts < 3) throw { name: "ResourceNotFoundException" };
      // return "ACTIVE" on the 3rd attempt:
      return {
        TableStatus: "ACTIVE",
      } as unknown as ReturnType<typeof table.ddbClient.describeTable>;
    });

    const createTableSpy = vi.spyOn(table.ddbClient, "createTable").mockResolvedValue({
      TableStatus: "not ready yet...",
    });

    await expect(ensureTableIsActive.call(table)).resolves.toBeUndefined();

    expect(table.isTableActive).toBe(true);
    expect(describeTableSpy).toHaveBeenCalledTimes(3); // <-- looped 3 times to call describeTable
    expect(createTableSpy).toHaveBeenCalledTimes(1);
  });

  it(`should call "createTable" with expected args and set "isTableActive" to true if it returns a "TableStatus" of "ACTIVE"`, async () => {
    const table = new DdbSingleTable({
      tableName: "TestTable",
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
      waitForActive: { enabled: true, frequency: 1 },
      tableConfigs: {
        createIfNotExists: true,
        billingMode: "PROVISIONED",
        provisionedThroughput: { read: 20, write: 20 },
      },
    });

    const describeTableSpy = vi.spyOn(table.ddbClient, "describeTable").mockImplementation(() => {
      vi.advanceTimersByTime(100);
      throw { name: "ResourceNotFoundException" };
    });

    const createTableSpy = vi.spyOn(table.ddbClient, "createTable").mockResolvedValueOnce({
      TableStatus: "ACTIVE",
    });

    await expect(ensureTableIsActive.call(table)).resolves.toBeUndefined();

    expect(table.isTableActive).toBe(true);
    expect(describeTableSpy).toHaveBeenCalledTimes(1);
    expect(createTableSpy).toHaveBeenCalledTimes(1);
    expect(createTableSpy).toHaveBeenCalledWith({
      BillingMode: "PROVISIONED",
      ProvisionedThroughput: {
        ReadCapacityUnits: 20,
        WriteCapacityUnits: 20,
      },
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
