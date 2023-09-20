import { isString, isRecordObject } from "./isType";
import { safeJsonStringify } from "./safeJsonStringify";
import type { ModelSchemaNestedAttributes, ModelSchemaAttributeConfig } from "../types";

/**
 * This is the base `error` class for custom errors defined in this package. If the
 * `message` arg is anything other than a truthy string, then the resultant Error's
 * `message` property will be set to a default value. A second `fallbackMsg` arg can
 * be provided to override the default message.
 */
export class DdbSingleTableError extends Error {
  static readonly DEFAULT_MSG: string = "An unknown error occurred";
  readonly name: string;

  constructor(message?: unknown, fallbackMsg: string = DdbSingleTableError.DEFAULT_MSG) {
    // This ctor allows `message` to be any type, but it's only used if it's a truthy string.
    super((isString(message) && message) || fallbackMsg);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, DdbSingleTableError);
  }
}

/**
 * This error wraps DDB-client [ECONNREFUSED errors]({@link DdbClientErrorECONNREFUSED})
 * for network/connection errors.
 * @param arg Either a string or DDB-client error.
 */
export class DdbConnectionError extends DdbSingleTableError {
  static override readonly DEFAULT_MSG: string =
    "Failed to connect to the provided DynamoDB endpoint";

  constructor(arg?: unknown) {
    let message = (isString(arg) && arg) || DdbConnectionError.DEFAULT_MSG;

    if (isRecordObject(arg) && isString(arg?.message)) {
      message += ` (${arg.message})`;
    }

    super(message);
    Error.captureStackTrace(this, DdbConnectionError);
  }
}

/**
 * The shape of a DDB-client ECONNREFUSED error (this type is not exported by the SDK).
 * @internal
 */
export interface DdbClientErrorECONNREFUSED {
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

/**
 * This error is thrown by schema-validation functions when a `TableKeysSchema`
 * or `ModelSchema` is invalid.
 */
export class SchemaValidationError extends DdbSingleTableError {
  static override readonly DEFAULT_MSG: string = "Invalid schema";

  constructor(message?: unknown) {
    super(message, SchemaValidationError.DEFAULT_MSG);
    Error.captureStackTrace(this, SchemaValidationError);
  }
}

/**
 * This error is thrown by Model `IOAction` functions when run-time input
 * data is invalid.
 */
export class ItemInputError extends DdbSingleTableError {
  static override readonly DEFAULT_MSG: string = "Invalid item input";

  constructor(message?: unknown) {
    super(message, ItemInputError.DEFAULT_MSG);
    Error.captureStackTrace(this, ItemInputError);
  }
}

/**
 * This error is thrown by expression-generator utils when a run-time arg is invalid
 * (e.g., more than two K-V pairs for a `KeyConditionExpression`).
 *
 * To provide a consistent error message format, provide an [`InvalidExpressionErrorPayload`][err]
 * to the constructor.
 *
 * [err]: {@link InvalidExpressionErrorPayload}
 */
export class InvalidExpressionError extends DdbSingleTableError {
  static override readonly DEFAULT_MSG: string = "Invalid expression";

  constructor(arg?: unknown) {
    const message =
      isString(arg) && arg
        ? arg
        : isRecordObject(arg) &&
          isString(arg?.expressionName) &&
          isString(arg?.invalidValueDescription) &&
          isString(arg?.problem)
        ? `Invalid ${arg.invalidValueDescription} (generating ${arg.expressionName}): \n` +
          `${arg.problem}: ${safeJsonStringify(arg.invalidValue, null, 2)}`
        : InvalidExpressionError.DEFAULT_MSG;

    super(message);
    Error.captureStackTrace(this, InvalidExpressionError);
  }
}

/**
 * An object that may be passed to the `InvalidExpressionError` constructor for a
 * standardized error message format.
 * @internal
 */
export interface InvalidExpressionErrorPayload {
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

/**
 * Helper function which provides a consistent attribute identifier for error messages.
 */
export const getAttrErrID = (
  modelName: string,
  attrName: string,
  { alias }: Pick<ModelSchemaAttributeConfig, "alias">
) => {
  return `${modelName} property "${alias || attrName}"`;
};

/**
 * Helper function which stringifies a nested schema for error messages.
 */
export const stringifyNestedSchema = (nestedSchema: ModelSchemaNestedAttributes, spaces = 2) => {
  return safeJsonStringify(
    nestedSchema,
    (key: any, value: unknown) => {
      return [
        "isHashKey",
        "isRangeKey",
        "index",
        "required",
        "alias",
        "default",
        "validate",
        "transformValue",
      ].includes(key)
        ? undefined
        : value;
    },
    spaces
  );
};
