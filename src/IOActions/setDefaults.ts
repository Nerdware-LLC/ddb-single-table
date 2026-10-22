import { isFunction } from "@nerdware/ts-type-safety-utils";
import { getSchemaPlan } from "../Schema/schemaPlan.js";
import { isType } from "../utils/isType.js";
import type { IOAction } from "./types/index.js";
import type {
  ModelSchemaAttributeConfig,
  ModelSchemaType,
  ModelSchemaNestedArray,
} from "../Schema/types/index.js";
import type { BaseItem, SupportedAttributeValueType } from "../types/index.js";

const copyContainers = (value: SupportedAttributeValueType): SupportedAttributeValueType => {
  if (Array.isArray(value)) return value.map(copyContainers);
  if (isType.map(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, copyContainers(child)])
    );
  }
  return value;
};

/**
 * Apply defaults to a copied, connected tree; functional defaults always see its root.
 */
export const setDefaults: IOAction = function (this, item, { schema, schemaEntries }) {
  if (!getSchemaPlan(schema).defaults) return item;

  const root = copyContainers(item) as BaseItem;

  const apply = (
    target: BaseItem | SupportedAttributeValueType[],
    key: string | number,
    config: ModelSchemaAttributeConfig
  ) => {
    const record = target as Record<string, SupportedAttributeValueType>;
    const name = String(key);

    if (
      Object.hasOwn(config, "default")
      && (!Object.hasOwn(record, name) || record[name] === null || record[name] === undefined)
    ) {
      const value = isFunction(config.default) ? config.default(root) : config.default;

      Object.defineProperty(record, name, {
        value: copyContainers(value),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }

    const value = record[name];
    if (!config.schema || value === null || value === undefined) return;

    if (Array.isArray(config.schema) && Array.isArray(value)) {
      const nested = config.schema as ModelSchemaNestedArray;

      for (let index = 0; index < value.length; index++) {
        const element = nested.length > 1 ? nested[index] : nested[0];
        if (Object.hasOwn(nested, nested.length > 1 ? index : 0)) apply(value, index, element);
      }
    } else if (isType.map(value) && !Array.isArray(config.schema)) {
      for (const [child, childConfig] of getSchemaPlan(config.schema as ModelSchemaType).entries) {
        apply(value, child, childConfig);
      }
    }
  };

  for (const [key, config] of schemaEntries) apply(root, key, config);

  return root;
};
