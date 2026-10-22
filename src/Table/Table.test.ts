import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { Model } from "../Model/index.js";
import { SchemaValidationError } from "../utils/index.js";
import { Table } from "./Table.js";
import type { MarshallingConfigs } from "../DdbClientWrapper/index.js";

describe("Table", () => {
  // Setup a ddb client:
  const ddbClient = new DynamoDBClient({
    region: "local",
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "local",
      secretAccessKey: "local",
    },
  });

  describe("new Table()", () => {
    test("returns a Table instance with expected properties when provided valid arguments", () => {
      const table = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });
      expect(table).toBeInstanceOf(Table);
    });

    test(`creates a DdbClientWrapper instance with the provided "marshallingConfigs"`, () => {
      // Arrange custom marshalling configs:
      const customMarshallingConfigs = {
        marshallOptions: {
          convertEmptyValues: true,
          removeUndefinedValues: false,
          convertClassInstanceToMap: false,
          convertTopLevelContainer: true,
        },
        unmarshallOptions: {
          wrapNumbers: true,
        },
      } as const satisfies MarshallingConfigs;

      const table = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
        marshallingConfigs: customMarshallingConfigs,
      });
      expect((table.ddb as any).defaultMarshallingConfigs).toStrictEqual({
        marshallOptions: {
          ...Table.DEFAULT_MARSHALLING_CONFIGS.marshallOptions,
          ...customMarshallingConfigs.marshallOptions,
        },
        unmarshallOptions: {
          ...Table.DEFAULT_MARSHALLING_CONFIGS.unmarshallOptions,
          ...customMarshallingConfigs.unmarshallOptions,
        },
      });
    });

    test("returns a valid Table instance even if there's no tableRangeKey", () => {
      const table = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
        },
      });
      expect(table).toBeInstanceOf(Table);
    });

    test(`throws a SchemaValidationError when provided an invalid "tableKeysSchema" argument`, () => {
      expect(
        () =>
          new Table({
            ddbClient,
            tableName: "MockTable",
            tableKeysSchema: {
              partitionKey: { type: "string" }, // missing `isHashKey` and `required`
              sortKey: { type: "string" }, //      missing `isSortKey` and `required`
            } as any,
          })
      ).toThrow(SchemaValidationError);
      expect(
        () =>
          new Table({
            ddbClient,
            tableName: "MockTable",
            tableKeysSchema: {
              partitionKey: { type: "string", isHashKey: true, required: true },
              sortKey: {
                type: "string",
                isRangeKey: true,
                required: true,
                index: {} as any, // <-- invalid index config
              },
            },
          })
      ).toThrow(SchemaValidationError);
    });
  });

  describe("table.getModelSchema()", () => {
    test(`returns a merged Model and TableKeys schema when called with valid arguments`, () => {
      // Arrange table instance:
      const table = new Table({
        ddbClient,
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });

      // Act on the table instance's getModelSchema method:
      const result = table.getModelSchema({ fooAttribute: { type: "string" } });

      // Assert the result:
      expect(result).toStrictEqual({
        partitionKey: { type: "string", required: true },
        sortKey: { type: "string", required: true },
        fooAttribute: { type: "string" },
      });
    });
  });

  describe("table.createModel()", () => {
    const clientOptions = {
      region: "local",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    };

    const createFixture = () => {
      const client = new DynamoDBClient(clientOptions);
      const mock = mockClient(client);
      const table = new Table({
        tableName: "Audit",
        ddbClient: client,
        tableKeysSchema: {
          pk: { type: "string", required: true, isHashKey: true },
          sk: { type: "string", required: true, isRangeKey: true },
          gpk: { type: "string", required: true, index: { name: "gsi", rangeKey: "sk" } },
        },
      });
      const model = table.createModel("Audit", {
        pk: { alias: "id" },
        text: { type: "string" },
        date: { type: "Date" },
        profile: { type: "map", schema: { text: { type: "string" }, date: { type: "Date" } } },
      });
      return { client, mock, table, model };
    };

    test("returns a new Model instance when called with valid arguments", () => {
      const table = new Table({
        ddbClient,
        tableName: "myTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });
      const model = table.createModel("TestModel", { attributeA: { type: "string" } });
      expect(model).toBeInstanceOf(Model);
    });

    test(`passes "indexes" to the Model constructor`, () => {
      const table = new Table({
        ddbClient,
        tableName: "myTable",
        tableKeysSchema: {
          pk: { type: "string", isHashKey: true, required: true },
          sk: { type: "string", isRangeKey: true, required: true },
          data: {
            type: "string",
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

      const modelResult = table.createModel("TestModel", { attributeA: { type: "string" } });

      expect(modelResult.indexes).toStrictEqual({
        data_gsi: {
          name: "data_gsi",
          type: "GLOBAL",
          indexPK: "data",
          indexSK: "sk",
        },
      });
    });

    test("requires complete configs for non-key attributes even when keys are inherited", () => {
      const { table } = createFixture();
      try {
        // @ts-expect-error Only inherited table keys may omit their type config.
        expect(() => table.createModel("Bad", { missing: { required: true } })).toThrow("type");
      } finally {
        table.dispose({ destroyClient: true });
      }
    });
  });

  describe("table.dispose()", () => {
    const clientOptions = {
      region: "local",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    };

    test("disposal is idempotent and refuses to destroy shared clients", () => {
      const client = new DynamoDBClient(clientOptions);
      const destroy = vi.spyOn(client, "destroy");
      const parameters = {
        tableName: "Shared",
        ddbClient: client,
        tableKeysSchema: { pk: { type: "string", required: true, isHashKey: true } },
      } as const;
      const before = process.listenerCount("exit");
      const first = new Table(parameters);
      const second = new Table(parameters);
      expect(process.listenerCount("exit") - before).toBeLessThanOrEqual(1);
      expect(() => first.dispose({ destroyClient: true })).toThrow("another table");
      first.dispose();
      second.dispose({ destroyClient: true });
      second.dispose({ destroyClient: true });
      expect(destroy).toHaveBeenCalledTimes(1);
    });
  });
});
