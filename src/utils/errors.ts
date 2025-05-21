import { CONNREFUSED as ECONNREFUSED } from "node:dns";
import { safeJsonStringify, isPlainObject, isString } from "@nerdware/ts-type-safety-utils";
import type {
  ModelSchemaNestedAttributes,
  ModelSchemaAttributeConfig,
} from "../Schema/types/index.js";

/**
 * This is the base `error` class for custom errors defined in this package. If the
 * `message` arg is anything other than a truthy string, then the resultant Error's
 * `message` property will be set to a default value. A second `fallbackMsg` arg can
 * be provided to override the default message.
 */
export class DdbSingleTableError extends Error {
  static readonly DEFAULT_MSG: string = "An unknown error occurred";
  override readonly name: string;

  constructor(message?: unknown, fallbackMsg: string = DdbSingleTableError.DEFAULT_MSG) {
    // This ctor allows `message` to be any type, but it's only used if it's a truthy string.
    super((isString(message) && message) || fallbackMsg);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, DdbSingleTableError);
  }
}

/**
 * This error is used for network/connection errors.
 */
export class DdbConnectionError
  extends DdbSingleTableError
  implements SetNonNullable<NodeJS.ErrnoException, "code">
{
  static override readonly DEFAULT_MSG: string =
    "Failed to connect to the provided DynamoDB endpoint";

  /** Dictionary of relevant, connection-related NodeJS `err.code` values. */
  static readonly NODE_ERROR_CODES = {
    ECONNREFUSED,
  } as const satisfies { [errCode: string]: NonNullable<NodeJS.ErrnoException["code"]> };

  /** The {@link NodeJS.ErrnoException|NodeJS error code}. */
  readonly code: NonNullable<NodeJS.ErrnoException["code"]>;

  constructor(arg?: unknown) {
    // Set defaults:
    let message: string = DdbConnectionError.DEFAULT_MSG,
      code: string = DdbConnectionError.NODE_ERROR_CODES.ECONNREFUSED;

    if (isNonEmptyString(arg)) {
      message = arg;
    } else if (isPlainObject(arg)) {
      if (isNonEmptyString(arg.message)) message += ` (${arg.message})`;
      if (isNonEmptyString(arg.code)) code = arg.code;
    }

    super(message);
    this.code = code;
    Error.captureStackTrace(this, DdbConnectionError);
  }
}

/**
 * This error is thrown by schema-validation functions when a `TableKeysSchema`
 * or `ModelSchema` is invalid.
 *
 * The provided {@link SchemaValidationErrorPayload} is used to create an error
 * message formatted as follows:
 *
 * > `{schemaName} is invalid: {problem}.`
 */
export class SchemaValidationError extends DdbSingleTableError {
  static override readonly DEFAULT_MSG: string = "Invalid schema";

  constructor(message: SchemaValidationErrorPayload) {
    const msgOrFormattedString =
      isPlainObject(message) && isString(message.schemaName) && isString(message.problem)
        ? `${message.schemaName} is invalid: ${message.problem}.`
        : message;

    super(msgOrFormattedString, SchemaValidationError.DEFAULT_MSG);
    Error.captureStackTrace(this, SchemaValidationError);
  }
}

/**
 * An object that may be passed to a `SchemaValidationError` for a standardized error message format.
 */
export type SchemaValidationErrorPayload = {
  schemaName: string;
  problem: string;
};

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
        : isPlainObject(arg)
            && isString(arg.expressionName)
            && isString(arg.invalidValueDescription)
            && isString(arg.problem)
          ? `Invalid ${arg.invalidValueDescription} (generating ${arg.expressionName}): \n`
            + `${arg.problem}: ${safeJsonStringify(arg.invalidValue, null, 2)}`
          : InvalidExpressionError.DEFAULT_MSG;

    super(message);
    Error.captureStackTrace(this, InvalidExpressionError);
  }
}

/**
 * An object that may be passed to the `InvalidExpressionError` constructor for a
 * standardized error message format.
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
  // prettier-ignore
  const strippedKeys: Array<string> = [
    "isHashKey", "isRangeKey", "index", "required", "alias", "default", "validate", "transformValue",
  ] satisfies Array<keyof KeyAttributeConfig>;

  return safeJsonStringify(
    nestedSchema,
    (key: unknown, value: unknown) => {
      return typeof key === "string" && strippedKeys.includes(key) ? undefined : value;
    },
    spaces
  );
};
