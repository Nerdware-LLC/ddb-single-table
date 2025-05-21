import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Model } from "../Model/index.js";
import { SchemaValidationError } from "../utils/index.js";
import { Table } from "./Table.js";
import type { MarshallingConfigs } from "../utils/index.js";

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
      ).toThrowError(SchemaValidationError);
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
      ).toThrowError(SchemaValidationError);
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
  });
});
