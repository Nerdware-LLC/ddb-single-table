import { hasKey } from "@nerdware/ts-type-safety-utils";
import { SchemaValidationError } from "../utils/errors.js";
import { Schema } from "./Schema.js";
import type {
  ModelSchemaType,
  ModelSchemaOptions,
  ModelSchemaMetadata,
  KeyAttributeConfig,
  ModelSchemaEntries,
} from "./types.js";
import type { TableKeysAndIndexes } from "../Table/index.js";

/**
 * This class and its `Schema` parent class currently only serve to organize schema-related types,
 * validation methods, etc., but may be used to create schema instances in the future. This is
 * currently not the case, as schema attributes would need to be nested under an instance property
 * (e.g. `this.attributes`), which would require a lot of refactoring. If/when this is implemented,
 * schema instances would also be given "metadata" props like "name", "version", "schemaType", etc.
 *
 * @class ModelSchema
 * @internal
 */
export class ModelSchema extends Schema {
  static readonly DEFAULT_OPTIONS = {
    allowUnknownAttributes: false,
    autoAddTimestamps: true,
  } as const satisfies ModelSchemaOptions;

  static readonly TIMESTAMP_ATTRIBUTES = {
    createdAt: { type: "Date", required: true, default: () => new Date() },
    updatedAt: { type: "Date", required: true, default: () => new Date() },
  } as const;

  /**
   * This function validates the provided `modelSchema`, and if valid, returns an
   * object specifying the Model's alias maps:
   *   - `attributesToAliasesMap`
   *   - `aliasesToAttributesMap`
   *
   * This function performs the following validation checks:
   *
   * 1. Ensure ModelSchema does not specify key-attribute configs which are only valid in the
   *    TableKeysSchema (e.g. "isHashKey", "isRangeKey", "index")
   * 2. Ensure all "alias" values are unique
   *
   * @param modelSchema - The schema to validate.
   * @param name - A name to identify the schema in any error messages.
   * @returns An object specifying the Model's alias maps.
   * @throws {@link SchemaValidationError} - If the provided ModelSchema is invalid.
   */
  static readonly validate = (
    modelSchema: ModelSchemaType,
    { name: schemaName }: Pick<ModelSchemaMetadata, "name">
  ) => {
    // First run the base Schema validation checks:
    Schema.validateAttributeTypes(modelSchema, {
      schemaType: "ModelSchema",
      name: schemaName,
    });

    // Then run the ModelSchema-specific validation checks:

    const attributesToAliasesMap: Record<string, string> = {};
    const aliasesToAttributesMap: Record<string, string> = {};

    for (const attrName in modelSchema) {
      const { alias, ...attrConfigs } = modelSchema[attrName];

      // Ensure ModelSchema doesn't include key/index configs which are only valid in the TableKeysSchema
      (["isHashKey", "isRangeKey", "index"] satisfies Array<keyof KeyAttributeConfig>).forEach(
        (keyConfigProperty) => {
          if (hasKey(attrConfigs, keyConfigProperty)) {
            throw new SchemaValidationError({
              schemaName,
              problem: `attribute "${attrName}" includes an "${keyConfigProperty}" config, which is only valid in the TableKeysSchema`,
            });
          }
        }
      );

      // If an "alias" is specified, ensure it's unique, and add it to the alias maps
      if (alias) {
        // If alias already exists in accum, there's a dupe alias in the schema, throw error
        if (alias in aliasesToAttributesMap) {
          throw new SchemaValidationError({
            schemaName,
            problem: `the ModelSchema contains duplicate alias "${alias}"`,
          });
        }

        // Add attrName/alias to the alias maps
        attributesToAliasesMap[attrName] = alias;
        aliasesToAttributesMap[alias] = attrName;
      }
    }

    return {
      attributesToAliasesMap,
      aliasesToAttributesMap,
    };
  };

  /**
   * This function provides sorted ModelSchema entries for IO-Actions. After passing the provided
   * `modelSchema` into Object.entries, the resulting entries array is sorted as follows:
   *
   * 1. The `tableHashKey` is sorted to the front.
   * 2. The `tableRangeKey`, if present, goes after the `tableHashKey`.
   * 3. Index PKs, if any, go after the `tableRangeKey`.
   * 4. For all other attributes, the order in the provided `modelSchema` is preserved.
   *
   * @param modelSchema - The ModelSchema object to use to obtain sorted entries.
   * @returns An array of sorted ModelSchema entries.
   */
  static readonly getSortedSchemaEntries = (
    modelSchema: ModelSchemaType,
    { tableHashKey, tableRangeKey, indexes = {} }: TableKeysAndIndexes
  ): ModelSchemaEntries => {
    // Create a map of index PKs for quick lookup
    const indexPKs: Record<string, boolean> = {};

    for (const index of Object.values(indexes)) {
      indexPKs[index.indexPK] = true;
    }

    return Object.entries(modelSchema).sort(([attrNameA], [attrNameB]) => {
      return attrNameA === tableHashKey // Sort tableHashKey to the front
        ? -1
        : attrNameB === tableHashKey
          ? 1
          : attrNameA === tableRangeKey // tableRangeKey goes after tableHashKey
            ? -1
            : attrNameB === tableRangeKey
              ? 1
              : attrNameA in indexPKs // index PKs, if any, go after tableRangeKey
                ? -1
                : attrNameB in indexPKs
                  ? 1
                  : 0; // For all other attributes the order is unchanged
    });
  };
}
