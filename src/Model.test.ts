import { DdbSingleTable } from "./DdbSingleTable";
import { Model } from "./Model";
import { MOCK_ITEMS_SCHEMA } from "./tests/staticMockItems";

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

describe("Model", () => {
  describe("Model constructor", () => {
    // Mock table:
    const table = new DdbSingleTable({
      tableName: "mock-table",
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
      } as const,
      ddbClientConfigs: {
        region: "local",
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
      },
    });

    const modelName = "MockModel";

    const modelSchema = table.getModelSchema(MOCK_ITEMS_SCHEMA);

    const model = new Model(modelName, modelSchema, table);

    it("should create a valid Model instance when provided valid arguments", () => {
      // Assert
      expect(model).toBeInstanceOf(Model);
      expect(model.modelName).toBe(modelName);
      expect(model.schema).toBe(modelSchema);
      expect(model.tableHashKey).toBe(table.tableHashKey);
      expect(model.tableRangeKey).toBe(table.tableRangeKey);
      expect(model.indexes).toBe(table.indexes);
      expect(model.ddbClient).toBe(table.ddbClient);
      expect(model.schemaOptions.allowUnknownAttributes).toBe(false);
    });
  });
});
