import { Table } from "./Table";
import { Model } from "../Model";
import { SchemaValidationError } from "../utils";

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

describe("Table", () => {
  describe("new Table()", () => {
    test("returns a Table instance with expected properties when provided valid arguments", () => {
      const table = new Table({
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });
      expect(table).toBeInstanceOf(Table);
    });

    test(`throws a SchemaValidationError when provided an invalid "tableKeysSchema" argument`, () => {
      expect(() => {
        new Table({
          tableName: "MockTable",
          tableKeysSchema: {
            partitionKey: { type: "string" }, // missing `isHashKey` and `required`
            sortKey: { type: "string" }, //      missing `isSortKey` and `required`
          } as any,
        });
      }).toThrowError(SchemaValidationError);
      expect(() => {
        new Table({
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
        });
      }).toThrowError(SchemaValidationError);
    });
  });

  describe("table.getModelSchema()", () => {
    test(`throws an error when called with an invalid "modelSchema" argument`, () => {
      const table = new Table({
        tableName: "MockTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });
      expect(() => {
        table.getModelSchema({
          fooAttributeName: {
            type: "string",
            nonExistentAttrConfig: "", // <-- should cause an error
          },
        } as const);
      }).toThrow(/nonExistentAttrConfig/);
    });
  });

  describe("table.createModel()", () => {
    test("returns a new Model instance when called with valid arguments", () => {
      const table = new Table({
        tableName: "myTable",
        tableKeysSchema: {
          partitionKey: { type: "string", isHashKey: true, required: true },
          sortKey: { type: "string", isRangeKey: true, required: true },
        },
      });
      const model = table.createModel("TestModel", { attributeA: { type: "string" } });
      expect(model).toBeInstanceOf(Model);
    });
  });
});
