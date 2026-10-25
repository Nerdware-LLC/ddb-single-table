import { hasKey, isPlainObject } from "@nerdware/ts-type-safety-utils";
import { SchemaValidationError, isType } from "../utils/index.js";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  SchemaMetadata,
  AnyValidAttributeConfig,
} from "./types/index.js";

/**
 * The base class for `TableKeysSchema` and `ModelSchema`. This class and its subclasses currently
 * only serve to organize schema-related types, validation methods, etc., but may be used to create
 * schema instances in the future. This is currently not the case, as schema attributes would need
 * to be nested under an instance property (e.g. `this.attributes`), which would require a lot of
 * refactoring. If/when this is implemented, schema instances would also be given "metadata" props
 * like "name", "version", "format", "schemaType", etc.
 */
export class BaseSchema {
  /**
   * This method ensures the provided `schema` is a valid `Schema` object by performing the
   * following validation checks:
   *
   * 1. Ensure the provided `schema` is a non-empty enumerable object.
   * 2. Ensure a valid "type" is specified for all attributes.
   * 3. Ensure "map", "array", and "tuple" attributes include a valid "schema" config.
   * 4. Ensure "enum" attributes include a valid "oneOf" config.
   * 5. Ensure "default" values comply with "type".
   *
   * @param schema - The schema to validate.
   * @param schemaType - The type of schema being validated ("TableKeysSchema" or "ModelSchema").
   * @param name - A name to identify the schema in any error messages (defaults to "schemaType" if not provided).
   */
  static readonly validateAttributeTypes = <
    const S extends TableKeysSchemaType | ModelSchemaType<TableKeysSchemaType>,
  >(
    schema: S,
    { schemaType, name: schemaName = schemaType }: SchemaMetadata,
    depth = 0
  ) => {
    // Ensure schema is a plain Record-like object
    if (!isPlainObject(schema)) {
      // Get a string representation of the schema's type
      const schemaTypeErrStr =
        typeof schema !== "object"
          ? typeof schema
          : Object.prototype.toString.call(schema).slice(8, -1); // e.g. "[object Array]" => "Array"

      throw new SchemaValidationError({
        schemaName,
        problem: `schema must be a plain object, but received "${schemaTypeErrStr}"`,
      });
    }

    // Get the schema's keys/attrNames
    const schemaAttrNames: Array<keyof S> = Object.keys(schema);
    const numAttributes = schemaAttrNames.length;

    // Ensure schema is not empty
    if (numAttributes === 0) {
      throw new SchemaValidationError({
        schemaName,
        problem: `schema does not contain any attributes`,
      });
    }

    // Iterate over schema keys and validate the attribute configs
    for (let i = 0; i < numAttributes; i++) {
      // const schema = schema;
      const attrName = schemaAttrNames[i] as string;
      const attrConfig = schema[schemaAttrNames[i]] as AnyValidAttributeConfig;

      if (!isPlainObject(attrConfig))
        throw new SchemaValidationError({
          schemaName,
          problem: `attribute "${attrName}" must have an object configuration`,
        });

      const { type, schema: nestedSchema, oneOf } = attrConfig;

      if (depth > 0 && attrConfig.alias !== undefined)
        throw new SchemaValidationError({
          schemaName,
          problem: `nested attribute "${attrName}" cannot define an alias`,
        });

      // Ensure "type" was provided
      if (!(type as unknown)) {
        throw new SchemaValidationError({
          schemaName,
          problem: `attribute "${attrName}" does not specify a "type"`,
        });
      }

      // Ensure "type" is one of the allowed values:

      // TYPE: "map" | "array" | "tuple" (nested-schema types)
      if (["map", "array", "tuple"].includes(type)) {
        // NESTED TYPES: ensure a nested "schema" is defined
        if (!nestedSchema) {
          throw new SchemaValidationError({
            schemaName,
            problem: `attribute "${attrName}" is of type "${type}", but does not specify a nested "schema"`,
          });
        }
        // NESTED TYPES: ensure "schema" is correct type
        if (
          (type === "map" && !isType.map(nestedSchema))
          || (type === "array" && !isType.array(nestedSchema))
          || (type === "tuple" && !isType.array(nestedSchema))
        ) {
          throw new SchemaValidationError({
            schemaName,
            problem: `attribute "${attrName}" is of type "${type}", but its nested "schema" is not an ${type === "map" ? "object" : "array"}`,
          });
        }

        if (depth >= 32) {
          throw new SchemaValidationError({
            schemaName,
            problem: `attribute "${attrName}" exceeds the maximum nesting depth of 32`,
          });
        }

        if (Array.isArray(nestedSchema) && nestedSchema.length === 0) {
          throw new SchemaValidationError({
            schemaName,
            problem: `attribute "${attrName}" must define at least one element schema`,
          });
        }

        const nested = Array.isArray(nestedSchema)
          ? Object.fromEntries(nestedSchema.map((config, index) => [index, config]))
          : nestedSchema;

        BaseSchema.validateAttributeTypes(
          nested as ModelSchemaType,
          { schemaType, name: `${schemaName}.${attrName}` },
          depth + 1
        );

        // TYPE: "enum"
      } else if (type === "enum") {
        // ENUM TYPE: ensure "oneOf" is defined and is a non-empty array
        if (
          !Array.isArray(oneOf)
          || oneOf.length === 0
          || oneOf.some((value) => typeof value !== "string")
        ) {
          throw new SchemaValidationError({
            schemaName,
            problem: `attribute "${attrName}" is of type "enum", but does not specify a valid "oneOf" array`,
          });
        }
        // TYPE: "string" | "number" | "boolean" | "Buffer" | "Date"
      } else if (!["string", "number", "boolean", "Buffer", "Date"].includes(type)) {
        // If it's none of the above, throw an error
        throw new SchemaValidationError({
          schemaName,
          problem: `attribute "${attrName}" has an invalid "type" value (must be "string", "number", "boolean", "Buffer", "Date", "map", "array", "tuple", or "enum")`,
        });
      }

      // Check if "default" is specified
      if (hasKey(attrConfig, "default")) {
        // Literal defaults must match the type, or be null for a nullable attribute.
        const defaultValue = attrConfig.default;

        if (
          typeof defaultValue !== "function"
          && !(defaultValue === null && attrConfig.nullable === true)
          && !isType[type](defaultValue, oneOf ?? nestedSchema)
        ) {
          throw new SchemaValidationError({
            schemaName,
            problem: `attribute "${attrName}" specifies a "default" value of type "${typeof defaultValue}", but the attribute's configured "type" is "${type}"`,
          });
        }
      }
    }
  };
}
