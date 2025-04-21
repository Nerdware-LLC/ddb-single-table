import { isNull, isUndefined } from "@nerdware/ts-type-safety-utils";
import { isConvertibleToDate } from "../utils/index.js";
import type { ModelSchemaNestedMap, ModelSchemaAttributeConfig } from "./types/index.js";
import type { TimestampAttributes } from "../types/TimestampAttributes.js";

/**
 * A base timestamp attribute config for a Model-schema's "createdAt" and/or "updatedAt" attributes.
 */
export const BASE_TIMESTAMP_ATTRIBUTE_CONFIG = {
  type: "Date",
  required: true,
  default: () => new Date(),
  validate: (value: unknown) => {
    return value
      ? isConvertibleToDate(value) //           If value is truthy, it must be a valid timestamp.
      : isNull(value) || isUndefined(value); // If value is falsey, it must be null/undefined.
  },
} as const satisfies ModelSchemaAttributeConfig;

/**
 * Timestamp attributes for a ModelSchema.
 */
export const TIMESTAMP_ATTRIBUTES = {
  createdAt: {
    ...BASE_TIMESTAMP_ATTRIBUTE_CONFIG,
  },
  updatedAt: {
    ...BASE_TIMESTAMP_ATTRIBUTE_CONFIG,
    transformValue: {
      /** This toDB ensures `updatedAt` is updated on every write operation. */
      toDB: () => new Date(),
    },
  },
} as const satisfies ModelSchemaNestedMap &
  Record<keyof TimestampAttributes, ModelSchemaAttributeConfig>;
