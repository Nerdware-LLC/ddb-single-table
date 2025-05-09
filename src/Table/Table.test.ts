import { Model } from "../Model/index.js";
import { SchemaValidationError } from "../utils/index.js";
import { Table } from "./Table.js";

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
    test(`returns a merged Model and TableKeys schema when called with valid arguments`, () => {
      // Arrange table instance:
      const table = new Table({
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
