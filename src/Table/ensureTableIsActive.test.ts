import {
  DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
  ResourceNotFoundException,
  TableStatus,
  BillingMode,
} from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { DdbSingleTableError, DdbConnectionError } from "../utils/index.js";
import { Table } from "./Table.js";
import type { CreateTableParameters } from "./types/index.js";

describe("Table", () => {
  describe("table.ensureTableIsActive()", () => {
    // Setup mock ddb client:
    const ddbClient = new DynamoDBClient({
      region: "local",
      endpoint: "http://localhost:8000",
      credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
      },
    });

    const mockDdbClient = mockClient(ddbClient);

    beforeEach(() => {
      // Setup the mock ddb client with a default response for all commands
      mockDdbClient.reset();
      mockDdbClient.onAnyCommand().resolves({});
    });

    /**
     * This fn is used by several tests below to stub setTimeout for testing timeout+retry behavior.
     */
    const setupTimerStubs = () => {
      // The mock behavior for the *first* setTimeout call varies from all subsequent calls.
      let isTestExecutionPastTheFirstSetTimeoutCall = false;

      vi.stubGlobal("setTimeout", (callback: () => void) => {
        // The first setTimeout call sets up the timeout timer, so we need to return a mock timer ID:
        if (isTestExecutionPastTheFirstSetTimeoutCall === false) {
          isTestExecutionPastTheFirstSetTimeoutCall = true;
          return 1; // Return 1 to simulate a mock timeoutTimerID (NodeJS.Timeout)
        }
        // For all subsequent calls, the callback is immediately invoked:
        return callback();
      });

      vi.stubGlobal("clearTimeout", () => undefined);
    };

    test(`throws a timeout-related error when "waitForActive.timeout" has been exceeded`, async () => {
      // Since this test involves timeout-behavior, we need to use fake timers:
      vi.useFakeTimers();

      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      const timeoutSeconds = 2;
      const timeoutMs = timeoutSeconds * 1000; // Convert to milliseconds

      // This mocked call just advances the mock-timer to trigger the timeout.
      mockDdbClient.on(DescribeTableCommand).callsFakeOnce(() => {
        vi.advanceTimersByTime(timeoutMs + 500);
        return Promise.resolve({ Table: { TableStatus: TableStatus.ACTIVE } });
      });

      await expect(mockTable.ensureTableIsActive({ timeout: timeoutSeconds })).rejects.toThrow(
        new DdbSingleTableError(
          `ensureTableIsActive has timed out after ${timeoutSeconds} seconds.`
        )
      );

      // Assert that the table is still not active after the timeout:
      expect(mockTable.isTableActive).toBe(false);

      // Reset the timers to avoid affecting other tests:
      vi.useRealTimers();
    });

    test(`sets "isTableActive" to true if "describeTable" returns a "TableStatus" of "ACTIVE"`, async () => {
      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      mockDdbClient
        .on(DescribeTableCommand)
        .resolvesOnce({ Table: { TableStatus: TableStatus.ACTIVE } });

      const result = await mockTable.ensureTableIsActive();

      expect(result).toBeUndefined();
      expect(mockTable.isTableActive).toBe(true);
      expect(mockDdbClient).toHaveReceivedCommandOnce(DescribeTableCommand);
    });

    test(`logs a status message using the "logger" method if "TableStatus" is not "ACTIVE"`, async () => {
      // Since this test involves retries/timeouts, we need to stub the timers:
      setupTimerStubs();

      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      mockDdbClient
        .on(DescribeTableCommand)
        .resolvesOnce({ Table: { TableStatus: null as any } }) // null simulates an UNKNOWN status
        .resolvesOnce({ Table: { TableStatus: TableStatus.UPDATING } })
        .resolvesOnce({ Table: { TableStatus: TableStatus.ACTIVE } }); // stops execution

      const loggerSpy = vi.spyOn(mockTable, "logger");

      await mockTable.ensureTableIsActive();

      const logMsgPrefix = `Table "${mockTable.tableName}" is not ACTIVE. Current table status: `;
      expect(loggerSpy).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenNthCalledWith(1, logMsgPrefix + "UNKNOWN");
      expect(loggerSpy).toHaveBeenNthCalledWith(2, logMsgPrefix + "UPDATING");
    });

    test(`throws an error if ProvisionedThroughput configs are provided and BillingMode is PAY_PER_REQUEST`, async () => {
      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      mockDdbClient
        .on(DescribeTableCommand)
        .rejectsOnce(new ResourceNotFoundException({ message: "", $metadata: {} }));

      await expect(
        mockTable.ensureTableIsActive({
          createIfNotExists: {
            BillingMode: BillingMode.PAY_PER_REQUEST,
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        })
      ).rejects.toThrow(
        new DdbSingleTableError(
          `Invalid "createTable" args: "ProvisionedThroughput" should not be `
            + `provided when "BillingMode" is "${BillingMode.PAY_PER_REQUEST}".`
        )
      );
    });

    test(`throws a DdbConnectionError if "describeTable" throws an ECONNREFUSED error`, async () => {
      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      // Reject the DescribeTableCommand with a NodeJS ECONNREFUSED error:
      mockDdbClient.on(DescribeTableCommand).rejectsOnce({
        code: DdbConnectionError.NODE_ERROR_CODES.ECONNREFUSED,
      } satisfies Partial<NodeJS.ErrnoException> as any);

      await expect(mockTable.ensureTableIsActive()).rejects.toThrow(DdbConnectionError);

      expect(mockTable.isTableActive).toBe(false);
      expect(mockDdbClient).toHaveReceivedCommandOnce(DescribeTableCommand);
    });

    test(`re-throws any unknown/unexpected error that arises from the "describeTable" call`, async () => {
      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      mockDdbClient.on(DescribeTableCommand).rejectsOnce("FOO_ERROR");

      await expect(mockTable.ensureTableIsActive()).rejects.toThrow("FOO_ERROR");

      expect(mockTable.isTableActive).toBe(false);
      expect(mockDdbClient).toHaveReceivedCommandOnce(DescribeTableCommand);
    });

    test(`throws a DdbSingleTableError if "describeTable" throws a ResourceNotFoundException and "createIfNotExists" is false`, async () => {
      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      mockDdbClient
        .on(DescribeTableCommand)
        .rejectsOnce(new ResourceNotFoundException({ message: "", $metadata: {} }));

      await expect(mockTable.ensureTableIsActive()).rejects.toThrow(
        `Table "MockTable" not found. To have the table created automatically when `
          + `DynamoDB returns a "ResourceNotFoundException", set "createIfNotExists" to true.`
      );

      expect(mockTable.isTableActive).toBe(false);
      expect(mockDdbClient).toHaveReceivedCommandOnce(DescribeTableCommand);
    });

    test(`creates a table and sets "isTableActive" to true even if "describeTable" must be called multiple times`, async () => {
      // Since this test involves retries/timeouts, we need to stub the timers:
      setupTimerStubs();

      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      // 3 DescribeTable calls: throw ResourceNotFoundException twice, then return ACTIVE:
      mockDdbClient
        .on(DescribeTableCommand)
        .rejectsOnce(new ResourceNotFoundException({ message: "", $metadata: {} }))
        .rejectsOnce(new ResourceNotFoundException({ message: "", $metadata: {} }))
        .resolvesOnce({ Table: { TableStatus: TableStatus.ACTIVE } });

      mockDdbClient
        .on(CreateTableCommand)
        .resolvesOnce({ TableDescription: { TableStatus: TableStatus.CREATING } });

      await expect(
        mockTable.ensureTableIsActive({ createIfNotExists: true, frequency: 1 })
      ).resolves.toBeUndefined();

      expect(mockTable.isTableActive).toBe(true);
      expect(mockDdbClient).toHaveReceivedCommandTimes(DescribeTableCommand, 3);
      expect(mockDdbClient).toHaveReceivedCommandTimes(CreateTableCommand, 1);
    });

    test(`calls "createTable" with expected args and sets "isTableActive" to true when it returns a "TableStatus" of "ACTIVE"`, async () => {
      const mockTable = new Table({
        ddbClient,
        tableName: "MockTable",
        // Yes this is a weird schema — it's just for testing to ensure all
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

      mockDdbClient
        .on(DescribeTableCommand)
        .rejectsOnce(new ResourceNotFoundException({ message: "", $metadata: {} }));

      mockDdbClient
        .on(CreateTableCommand)
        .resolvesOnce({ TableDescription: { TableStatus: TableStatus.ACTIVE } });

      const createTableInputs: CreateTableParameters = {
        BillingMode: BillingMode.PROVISIONED,
        ProvisionedThroughput: {
          ReadCapacityUnits: 20,
          WriteCapacityUnits: 20,
        },
      };

      await expect(
        mockTable.ensureTableIsActive({ createIfNotExists: createTableInputs, frequency: 1 })
      ).resolves.toBeUndefined();

      expect(mockTable.isTableActive).toBe(true);
      expect(mockDdbClient).toHaveReceivedCommandOnce(DescribeTableCommand);
      expect(mockDdbClient).toHaveReceivedCommandExactlyOnceWith(CreateTableCommand, {
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

    describe("deadline and retry cleanup", () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      const createMockTable = () =>
        new Table({
          ddbClient,
          tableName: "DeadlineTable",
          tableKeysSchema: { pk: { type: "string", isHashKey: true, required: true } },
          logger: () => {},
        });

      test("rejects while describeTable is pending and ignores a late ACTIVE response", async () => {
        const table = createMockTable();
        const pending = Promise.withResolvers<Awaited<ReturnType<typeof table.describeTable>>>();
        const describe = vi.spyOn(table, "describeTable").mockReturnValueOnce(pending.promise);
        const failure = table.ensureTableIsActive({ timeout: 1 }).catch((error: unknown) => error);

        await vi.advanceTimersByTimeAsync(1000);
        expect(await failure).toEqual(
          new DdbSingleTableError("ensureTableIsActive has timed out after 1 seconds.")
        );
        expect(vi.getTimerCount()).toBe(0);

        pending.resolve({ Table: { TableStatus: TableStatus.ACTIVE }, $metadata: {} });
        await vi.runAllTimersAsync();
        expect(table.isTableActive).toBe(false);
        expect(describe).toHaveBeenCalledTimes(1);
      });

      test("rejects while createTable is pending and ignores a late ACTIVE response", async () => {
        const table = createMockTable();
        const pending = Promise.withResolvers<Awaited<ReturnType<typeof table.createTable>>>();
        const describe = vi
          .spyOn(table, "describeTable")
          .mockRejectedValue(
            new ResourceNotFoundException({ message: "not found", $metadata: {} })
          );
        const create = vi.spyOn(table, "createTable").mockReturnValueOnce(pending.promise);
        const failure = table
          .ensureTableIsActive({ timeout: 1, createIfNotExists: true })
          .catch((error: unknown) => error);

        await vi.advanceTimersByTimeAsync(1000);
        expect(await failure).toEqual(
          new DdbSingleTableError("ensureTableIsActive has timed out after 1 seconds.")
        );
        expect(vi.getTimerCount()).toBe(0);

        pending.resolve({ TableDescription: { TableStatus: TableStatus.ACTIVE }, $metadata: {} });
        await vi.runAllTimersAsync();
        expect(table.isTableActive).toBe(false);
        expect(describe).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledTimes(1);
      });

      test("clears the polling timer when the deadline expires between requests", async () => {
        const table = createMockTable();
        const describe = vi.spyOn(table, "describeTable").mockResolvedValue({
          Table: { TableStatus: TableStatus.CREATING },
          $metadata: {},
        });
        const failure = table
          .ensureTableIsActive({ timeout: 1, frequency: 10 })
          .catch((error: unknown) => error);

        await vi.advanceTimersByTimeAsync(1000);
        expect(await failure).toEqual(
          new DdbSingleTableError("ensureTableIsActive has timed out after 1 seconds.")
        );
        expect(table.isTableActive).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(30000);
        expect(describe).toHaveBeenCalledTimes(1);
      });

      test("rejects on exhausted attempts without waiting after the final attempt", async () => {
        const table = createMockTable();
        const describe = vi.spyOn(table, "describeTable").mockResolvedValue({
          Table: { TableStatus: TableStatus.CREATING },
          $metadata: {},
        });
        const failure = table
          .ensureTableIsActive({ maxRetries: 2, frequency: 1, timeout: 30 })
          .catch((error: unknown) => error);

        await vi.advanceTimersByTimeAsync(1000);
        expect(await failure).toEqual(
          new DdbSingleTableError('Table "DeadlineTable" did not become ACTIVE after 2 attempts.')
        );
        expect(describe).toHaveBeenCalledTimes(2);
        expect(table.isTableActive).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
      });

      test("rejects without submitting a request when zero attempts are allowed", async () => {
        const table = createMockTable();
        const describe = vi.spyOn(table, "describeTable");

        await expect(table.ensureTableIsActive({ maxRetries: 0 })).rejects.toThrow(
          "after 0 attempts"
        );
        expect(describe).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
      });

      test("clears the deadline after a successful response", async () => {
        const table = createMockTable();
        vi.spyOn(table, "describeTable").mockResolvedValue({
          Table: { TableStatus: TableStatus.ACTIVE },
          $metadata: {},
        });

        await expect(table.ensureTableIsActive()).resolves.toBeUndefined();
        expect(table.isTableActive).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
        await vi.runAllTimersAsync();
      });

      test.each([new Error("request failed"), "non-object failure"])(
        "clears the deadline when a request fails with %s",
        async (error) => {
          const table = createMockTable();
          vi.spyOn(table, "describeTable").mockRejectedValue(error);

          await expect(table.ensureTableIsActive()).rejects.toBe(error);
          expect(table.isTableActive).toBe(false);
          expect(vi.getTimerCount()).toBe(0);
          await vi.runAllTimersAsync();
        }
      );

      test("clears the deadline when table creation fails", async () => {
        const table = createMockTable();
        vi.spyOn(table, "describeTable").mockRejectedValue(
          new ResourceNotFoundException({ message: "not found", $metadata: {} })
        );
        const error = new Error("create failed");
        vi.spyOn(table, "createTable").mockRejectedValue(error);

        await expect(table.ensureTableIsActive({ createIfNotExists: true })).rejects.toBe(error);
        expect(vi.getTimerCount()).toBe(0);
        await vi.runAllTimersAsync();
      });

      test("waits between repeated not-found responses and creates the table only once", async () => {
        const table = createMockTable();
        const describe = vi
          .spyOn(table, "describeTable")
          .mockRejectedValue(
            new ResourceNotFoundException({ message: "not found", $metadata: {} })
          );
        const create = vi.spyOn(table, "createTable").mockResolvedValue({
          TableDescription: { TableStatus: TableStatus.CREATING },
          $metadata: {},
        });
        const failure = table
          .ensureTableIsActive({ maxRetries: 3, frequency: 1, createIfNotExists: true })
          .catch((error: unknown) => error);

        await vi.advanceTimersByTimeAsync(0);
        expect(describe).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(999);
        expect(describe).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(describe).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1000);
        expect(await failure).toEqual(
          new DdbSingleTableError('Table "DeadlineTable" did not become ACTIVE after 3 attempts.')
        );
        expect(describe).toHaveBeenCalledTimes(3);
        expect(create).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
      });
    });
  });
});
