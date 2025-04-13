import { isNull, isUndefined } from "@nerdware/ts-type-safety-utils";
import { isConvertibleToDate } from "../utils/isConvertibleToDate.js";
import type { ModelSchemaAttributeConfig } from "./types.js";

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
