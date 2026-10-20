import type {
  ModelSchemaType,
  ModelSchemaEntries,
  ModelSchemaAttributeConfig,
} from "./types/index.js";

const plans = new WeakMap<object, SchemaPlan>();

type SchemaPlan = {
  entries: ModelSchemaEntries;
  defaults: boolean;
  toDB: boolean;
  fromDB: boolean;
};

/**
 * Cache only immutable schema snapshots, so edits to standalone schemas remain visible.
 */
export const getSchemaPlan = (schema: ModelSchemaType): SchemaPlan => {
  const cached = plans.get(schema);
  if (cached) return cached;

  const entries = Object.entries(schema);
  const configs = entries.map(([, config]) => config);

  const descendants = configs.flatMap((config) =>
    config.schema
      ? [
          getSchemaPlan(
            Array.isArray(config.schema)
              ? Object.freeze(
                  Object.fromEntries(config.schema.map((value, index) => [index, value]))
                )
              : (config.schema as ModelSchemaType)
          ),
        ]
      : []
  );

  const plan = {
    entries,
    defaults:
      configs.some((config) => Object.hasOwn(config, "default"))
      || descendants.some((child) => child.defaults),
    toDB:
      configs.some((config) => !!config.transformValue?.toDB)
      || descendants.some((child) => child.toDB),
    fromDB:
      configs.some((config) => !!config.transformValue?.fromDB)
      || descendants.some((child) => child.fromDB),
  };

  if (Object.isFrozen(schema)) plans.set(schema, plan);

  return plan;
};

/** Copy schema configuration before freezing; never freeze caller-owned values or functions. */
export const snapshotSchema = <T extends ModelSchemaType>(schema: T): T => {
  const copyConfig = (config: ModelSchemaAttributeConfig): ModelSchemaAttributeConfig =>
    Object.freeze({
      ...config,
      ...(config.oneOf && { oneOf: Object.freeze([...config.oneOf]) }),
      ...(config.transformValue && { transformValue: Object.freeze({ ...config.transformValue }) }),
      ...(config.schema && {
        schema: Array.isArray(config.schema)
          ? Object.freeze(config.schema.map(copyConfig))
          : snapshotSchema(config.schema as ModelSchemaType),
      }),
    });
  return Object.freeze(
    Object.fromEntries(Object.entries(schema).map(([key, config]) => [key, copyConfig(config)]))
  ) as T;
};

const wrappers = new WeakMap<
  ModelSchemaAttributeConfig,
  { schema: ModelSchemaType; schemaEntries: ModelSchemaEntries }
>();

export const getArrayWrapper = (config: ModelSchemaAttributeConfig) => {
  const existing = wrappers.get(config);
  if (existing) return existing;
  const wrapper = {
    schema: Object.isFrozen(config) ? Object.freeze({ _: config }) : { _: config },
    schemaEntries: [["_", config]] as ModelSchemaEntries,
  };
  if (Object.isFrozen(config)) wrappers.set(config, wrapper);
  return wrapper;
};
