import { safeJsonStringify } from "./safeJsonStringify";
import type { ModelSchemaAttributeConfig, ModelSchemaNestedAttributes } from "../types";

/**
 * This is the base `error` class for `DdbSingleTable`. If the `message` arg is anything
 * other than a truthy string, then the resultant Error's `message` property will be set
 * to a default value. A second `fallbackMsg` arg can be provided to override the default
 * message.
 */
export class DdbSingleTableError extends Error {
  static readonly DEFAULT_MSG = "An unknown error occurred";
  readonly name: string;

  constructor(message?: unknown) {
    // This ctor allows `message` to be any type, but it's only used if it's a truthy string.
    super((typeof message === "string" && message) || DdbSingleTableError.DEFAULT_MSG);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, DdbSingleTableError);
  }
}

/**
 * This error wraps DDB-client ECONNREFUSED errors for network/connection errors.
 * Note: DDB-client errors do not provide `name` or `message` properties.
 */
export class DdbConnectionError extends DdbSingleTableError {
  constructor(
    arg:
      | string
      | {
          message?: string;
          /** The DDB-client error code (e.g., "ECONNREFUSED"). */
          code?: string;
          /** The DDB-client error number (e.g., -111). */
          errno?: number;
          /** The DDB-client syscall (e.g., "connect"). */
          syscall?: string;
          /** The DDB-client endpoint IP address (e.g., "127.0.0.1"). */
          address?: number;
          /** The DDB-client endpoint port number (e.g., 8000). */
          port?: number;
          /** DDB-client error metadata */
          $metadata?: { attempts?: number; totalRetryDelay?: number };
          [key: string]: unknown;
        }
  ) {
    const message =
      typeof arg === "string"
        ? arg
        : `Failed to connect to the provided DynamoDB endpoint${
            typeof arg?.message === "string" ? ` (${arg.message})` : ``
          }.`;

    super(message);
    Error.captureStackTrace(this, DdbConnectionError);
  }
}

/**
 * This error is thrown by schema-validation functions when a `TableKeysSchema`
 * or `ModelSchema` is invalid.
 */
export class SchemaValidationError extends DdbSingleTableError {
  constructor(message = "Invalid schema") {
    super(message);
    Error.captureStackTrace(this, SchemaValidationError);
  }
}

/**
 * This error is thrown by Model `IOHookAction` functions when run-time input
 * data is invalid.
 */
export class ItemInputError extends DdbSingleTableError {
  constructor(message = "Invalid item input") {
    super(message);
    Error.captureStackTrace(this, ItemInputError);
  }
}

/**
 * This error is thrown by expression-generator utils when a run-time arg is invalid
 * (e.g., more than two K-V pairs for a `KeyConditionExpression`).
 */
export class InvalidExpressionError extends DdbSingleTableError {
  constructor(
    arg:
      | string
      | {
          /** The name of the expression being generated. */
          expressionName:
            | "ConditionExpression"
            | "KeyConditionExpression"
            | "UpdateExpression"
            | "FilterExpression"
            | "ProjectionExpression";
          /** A short explanation as to why the `invalidValue` is invalid. */
          problem: string;
          /** The invalid value. */
          invalidValue: unknown;
          /** A short description/name of the invalid value. */
          invalidValueDescription: string;
        }
  ) {
    const message =
      typeof arg === "string"
        ? arg
        : `Invalid ${arg.invalidValueDescription} (generating ${arg.expressionName}): \n` +
          `${arg.problem}: ${safeJsonStringify(arg.invalidValue, null, 2)}`;

    super(message);
    Error.captureStackTrace(this, InvalidExpressionError);
  }
}

/**
 * Helper function which provides a consistent attribute identifier for error messages.
 */
export const getAttrErrID = (
  modelName: string,
  attrName: string,
  { alias }: ModelSchemaAttributeConfig
) => {
  return `${modelName} property "${alias || attrName}"`;
};

/**
 * Helper function which stringifies a nested schema for error messages.
 */
export const stringifyNestedSchema = (
  nestedSchema: ModelSchemaNestedAttributes,
  propertiesToPrint: Array<keyof ModelSchemaAttributeConfig> = ["type", "oneOf", "schema"],
  spaces = 2
) => {
  return safeJsonStringify(
    nestedSchema,
    (key: any, value: unknown) => (propertiesToPrint.includes(key) ? value : undefined),
    spaces
  );
};
