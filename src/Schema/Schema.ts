import { SchemaValidationError, hasKey, isType } from "../utils";
import type { TableKeysSchemaType, ModelSchemaType, SchemaMetadata, SchemaEntries } from "./types";

/**
 * The base class for `TableKeysSchema` and `ModelSchema`. This class and its subclasses currently
 * only serve to organize schema-related types, validation methods, etc., but may be used to create
 * schema instances in the future. This is currently not the case, as schema attributes would need
 * to be nested under an instance property (e.g. `this.attributes`), which would require a lot of
 * refactoring. If/when this is implemented, schema instances would also be given "metadata" props
 * like "name", "version", "format", "schemaType", etc.
 *
 * @class Schema
 * @internal
 */
export class Schema {
  /**
   * This method performs the following `Schema` validation checks:
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
  static readonly validateAttributeTypes = (
    schema: TableKeysSchemaType | ModelSchemaType,
    { schemaType, name: schemaName = schemaType }: SchemaMetadata
  ) => {
    // Ensure schema is a Record-like object
    if (!isType.map(schema)) {
      throw new SchemaValidationError(
        `${schemaName} is invalid: schema must be an object, but received "${typeof schema}".`
      );
    }

    // Convert the schema to entries (casting to `SchemaEntries` allows checking nested `schema`)
    const schemaEntries = Object.entries(schema) as SchemaEntries;

    // Ensure schema is not empty
    if (schemaEntries.length === 0) {
      throw new SchemaValidationError(
        `${schemaName} is invalid: schema does not contain any attributes.`
      );
    }

    // Iterate over schema entries and validate the attribute configs
    schemaEntries.forEach(([attrName, attrConfig]) => {
      const { type, schema, oneOf } = attrConfig;

      // Ensure "type" was provided
      if (!type) {
        throw new SchemaValidationError(
          `${schemaName} is invalid: attribute "${attrName}" does not specify a "type".`
        );
      }

      // Ensure "type" is one of the allowed values:

      // TYPE: "map" | "array" | "tuple" (nested-schema types)
      if (["map", "array", "tuple"].includes(type)) {
        // NESTED TYPES: ensure a nested "schema" is defined
        if (!schema) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${attrName}" is of type "${type}", ` +
              `but does not specify a nested "schema".`
          );
        }
        // NESTED TYPES: ensure "schema" is correct type
        if (
          (type === "map" && !isType.map(schema)) ||
          (type === "array" && !isType.array(schema)) ||
          (type === "tuple" && !isType.array(schema))
        ) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${attrName}" is of type "${type}", ` +
              `but its nested "schema" is not an ${type === "map" ? "object" : "array"}.`
          );
        }
        // TYPE: "enum"
      } else if (type === "enum") {
        // ENUM TYPE: ensure "oneOf" is defined and is a non-empty array
        if (!Array.isArray(oneOf) || oneOf.length === 0) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${attrName}" is of type "enum", ` +
              `but does not specify a valid "oneOf" array.`
          );
        }
        // TYPE: "string" | "number" | "boolean" | "Buffer" | "Date"
      } else if (!["string", "number", "boolean", "Buffer", "Date"].includes(type)) {
        // If it's none of the above, throw an error
        throw new SchemaValidationError(
          `${schemaName} is invalid: attribute "${attrName}" has an invalid "type" value (must be ` +
            `"string", "number", "boolean", "Buffer", "Date", "map", "array", "tuple", or "enum").`
        );
      }

      // Check if "default" is specified
      if (hasKey(attrConfig, "default")) {
        // If the default is not a function, ensure its type matches the attr's defined "type"
        const defaultValue = attrConfig.default;

        if (typeof defaultValue !== "function" && !isType[type](defaultValue, oneOf)) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${attrName}" specifies a "default" value of type ` +
              `"${typeof defaultValue}", but the attribute's configured "type" is "${type}".`
          );
        }
      }
    });
  };
}
