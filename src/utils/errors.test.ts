import {
  DdbSingleTableError,
  DdbConnectionError,
  SchemaValidationError,
  InvalidExpressionError,
  ItemInputError,
  getAttrErrID,
  stringifyNestedSchema,
  type InvalidExpressionErrorPayload,
} from "./errors";
import type { ModelSchemaNestedAttributes } from "../types";

// This describe block includes tests that are the same for all error classes.
describe("errors", () => {
  [
    { name: "DdbSingleTableError", ErrorClass: DdbSingleTableError },
    { name: "DdbConnectionError", ErrorClass: DdbConnectionError },
    { name: "SchemaValidationError", ErrorClass: SchemaValidationError },
    { name: "InvalidExpressionError", ErrorClass: InvalidExpressionError },
    { name: "ItemInputError", ErrorClass: ItemInputError },
  ].forEach(({ name, ErrorClass }) => {
    test(`returns a valid ${name} instance when called with a custom error "message"`, () => {
      const errorMessage = "Test error message";
      const errorWithCustomMsg = new ErrorClass(errorMessage);
      expect(errorWithCustomMsg instanceof Error).toBe(true);
      expect(errorWithCustomMsg instanceof ErrorClass).toBe(true);
      expect(errorWithCustomMsg.name).toBe(name);
      expect(errorWithCustomMsg.message).toBe(errorMessage);
    });

    test(`returns a valid ${name} with a default message when called without args`, () => {
      const errorWithDefaultMsg = new ErrorClass();
      expect(errorWithDefaultMsg instanceof Error).toBe(true);
      expect(errorWithDefaultMsg instanceof ErrorClass).toBe(true);
      expect(errorWithDefaultMsg.name).toBe(name);
      expect(errorWithDefaultMsg.message).toBe(
        ErrorClass?.DEFAULT_MSG ?? DdbSingleTableError.DEFAULT_MSG
      );
    });

    test(`returns a valid ${name} with a default message when called with a "message" arg that's not a truthy string`, () => {
      [null, undefined, "", 1, 0, {}, [], Symbol("foo"), BigInt(1), () => {}].forEach((value) => {
        const errorWithDefaultMsg = new ErrorClass(value);
        expect(errorWithDefaultMsg instanceof Error).toBe(true);
        expect(errorWithDefaultMsg instanceof ErrorClass).toBe(true);
        expect(errorWithDefaultMsg.name).toBe(name);
        expect(errorWithDefaultMsg.message).toBe(
          ErrorClass?.DEFAULT_MSG ?? DdbSingleTableError.DEFAULT_MSG
        );
      });
    });

    test(`returns a ${name} with a stack property containing a stack trace`, () => {
      const error = new ErrorClass();
      expect(typeof error.stack).toBe("string");
      expect(error?.stack?.length).toBeGreaterThan(0);
    });

    test("returns a string containing the name and message properties when calling the toString method", () => {
      const errorMessage = "Test error message";
      const error = new ErrorClass(errorMessage);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      expect(error.toString()).toBe(`${name}: ${errorMessage}`);
    });
  });
});

// This describe block is unique to the DdbConnectionError class.
describe("DdbConnectionError", () => {
  test(`returns a "message" in the format of DEFAULT_MSG + customMessage`, () => {
    const customMessage = "CUSTOM_MESSAGE";
    const error = new DdbConnectionError({ message: customMessage });
    expect(error.message).toBe(DdbConnectionError.DEFAULT_MSG + ` (${customMessage})`);
  });
});

// This describe block is unique to the InvalidExpressionError class.
describe("InvalidExpressionError", () => {
  test(`returns a "message" in the standardized format when given the proper args`, () => {
    const payload: InvalidExpressionErrorPayload = {
      expressionName: "KeyConditionExpression",
      invalidValue: "BAD_VALUE",
      invalidValueDescription: "a bad value",
      problem: "It's a bad value",
    };
    const error = new InvalidExpressionError(payload);
    expect(error.message).toBe(
      `Invalid ${payload.invalidValueDescription} (generating ${payload.expressionName}): \n` +
        `${payload.problem}: "${payload.invalidValue as string}"`
    );
  });
});

describe("getAttrErrID", () => {
  test("returns a string with the correct format", () => {
    expect(getAttrErrID("MyModel", "pk", {})).toBe(`MyModel property "pk"`);
    expect(getAttrErrID("MyModel", "pk", { alias: "" })).toBe(`MyModel property "pk"`);
    expect(getAttrErrID("MyModel", "pk", { alias: undefined })).toBe(`MyModel property "pk"`);
    expect(getAttrErrID("MyModel", "pk", { alias: "foo" })).toBe(`MyModel property "foo"`);
  });
});

describe("stringifyNestedSchema", () => {
  test("returns a string with the correct format", () => {
    const schema: ModelSchemaNestedAttributes = {
      nestedAttr: {
        type: "map",
        schema: {
          foo: {
            type: "string",
            alias: "foo-id",
            default: () => "DEFAULT_ID",
            validate: () => true,
            transformValue: {},
          },
          bar: {
            type: "enum",
            oneOf: ["a", "b"],
          },
        },
      },
    };
    expect(stringifyNestedSchema(schema, 0)).toBe(
      `{"nestedAttr":{"type":"map","schema":{"foo":{"type":"string"},"bar":{"type":"enum","oneOf":["a","b"]}}}}`
    );
  });
});
