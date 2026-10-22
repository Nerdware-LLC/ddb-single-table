import { ItemInputError } from "../utils/errors.js";
import type {
  ModelSchemaType,
  ModelSchemaAttributeConfig,
  ModelSchemaNestedArray,
} from "../Schema/types/index.js";
import type { BaseItem, SupportedAttributeValueType } from "../types/index.js";

/**
 * Decode only declared Date fields; ISO-looking string and enum values remain strings.
 */
export const convertSchemaDates = (item: BaseItem, schema: ModelSchemaType): BaseItem => {
  const convert = (
    value: SupportedAttributeValueType,
    config: ModelSchemaAttributeConfig
  ): SupportedAttributeValueType => {
    if (value === null || value === undefined) return value;

    if (config.type === "Date") {
      const date = typeof value === "string" ? new Date(value) : value;
      if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
        throw new ItemInputError("Invalid stored Date value.");
      }
      return date;
    }

    if (config.schema && Array.isArray(value) && Array.isArray(config.schema)) {
      const nested = config.schema as ModelSchemaNestedArray;
      return value.map((child, index) => {
        const childConfig = nested.length > 1 ? nested[index] : nested[0];
        return Object.hasOwn(nested, nested.length > 1 ? index : 0)
          ? convert(child, childConfig)
          : child;
      });
    }

    if (
      config.type === "map"
      && config.schema
      && !Array.isArray(config.schema)
      && typeof value === "object"
    ) {
      return convertSchemaDates(value as BaseItem, config.schema as ModelSchemaType);
    }

    return value;
  };

  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key,
      Object.hasOwn(schema, key) ? convert(value, schema[key]) : value,
    ])
  );
};
