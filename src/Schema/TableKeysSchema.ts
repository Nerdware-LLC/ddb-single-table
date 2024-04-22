import { hasKey } from "@nerdware/ts-type-safety-utils";
import { Schema } from "./Schema.js";
import { SchemaValidationError } from "../utils/errors.js";
import type { TableKeysAndIndexes } from "../Table/types.js";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  BaseAttributeConfig,
  KeyAttributeConfig,
  TableKeysSchemaMetadata,
  MergeModelAndTableKeysSchema,
} from "./types.js";

/**
 * This class and its `Schema` parent class currently only serve to organize schema-related types,
 * validation methods, etc., but may be used to create schema instances in the future. This is
 * currently not the case, as schema attributes would need to be nested under an instance property
 * (e.g. `this.attributes`), which would require a lot of refactoring. If/when this is implemented,
 * schema instances would also be given "metadata" props like "name", "version", "schemaType", etc.
 *
 * @class TableKeysSchema
 * @internal
 */
export class TableKeysSchema extends Schema {
  /**
   * This function validates the provided `tableKeysSchema`, and if valid, returns a
   * {@link TableKeysAndIndexes | TableKeysAndIndexes object } specifying the `tableHashKey`,
   * `tableRangeKey`, and a map of any included `indexes`.
   *
   * This function performs the following validation checks:
   *
   * 1. Ensure all key/index attributes specify `isHashKey`, `isRangeKey`, or `index`.
   * 2. Ensure exactly 1 table hash key, and 1 table range key are specified.
   * 3. Ensure all key/index attribute `type`s are "string", "number", or "Buffer" (S/N/B in the DDB API).
   * 4. Ensure all key/index attributes are `required`.
   * 5. Ensure there are no duplicate index names.
   *
   * @param tableKeysSchema - The schema to validate.
   * @param name - The `name` specified in the {@link SchemaMetadata | schema's metadata }.
   * @returns A {@link TableKeysAndIndexes | TableKeysAndIndexes object }.
   * @throws A {@link SchemaValidationError} if the provided TableKeysSchema is invalid.
   */
  static readonly validate = (
    tableKeysSchema: TableKeysSchemaType,
    { name: schemaName = "TableKeysSchema" }: Pick<TableKeysSchemaMetadata, "name"> = {}
  ): TableKeysAndIndexes => {
    // First run the base Schema validation checks:
    Schema.validateAttributeTypes(tableKeysSchema, {
      schemaType: "TableKeysSchema",
      name: schemaName,
    });

    // Then perform TableKeysSchema-specific validation checks:
    const { tableHashKey, tableRangeKey, indexes } = Object.entries(tableKeysSchema).reduce(
      (
        accum: Partial<TableKeysAndIndexes>,
        [keyAttrName, { isHashKey, isRangeKey, index, type, required }]
      ) => {
        // Ensure all key/index attributes specify `isHashKey`, `isRangeKey`, or `index`
        if (isHashKey !== true && isRangeKey !== true && index === undefined) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${keyAttrName}" is not configured as a key or index.`
          );
        }

        // Ensure all key/index attribute `type`s are "string", "number", or "Buffer" (S/N/B in DDB)
        if (!["string", "number", "Buffer"].includes(type)) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${keyAttrName}" has an invalid "type" (must be "string", "number", or "Buffer").`
          );
        }

        // Ensure all key/index attributes are `required`
        if (required !== true) {
          throw new SchemaValidationError(
            `${schemaName} is invalid: attribute "${keyAttrName}" is not "required".`
          );
        }

        // Check for table hashKey
        if (isHashKey === true) {
          // Throw error if table hashKey already exists
          if (accum.tableHashKey) {
            throw new SchemaValidationError(
              `${schemaName} is invalid: multiple table hash keys ("${accum.tableHashKey}" and "${keyAttrName}").`
            );
          }
          accum.tableHashKey = keyAttrName;
        }

        // Check for table rangeKey
        if (isRangeKey === true) {
          // Throw error if table rangeKey already exists
          if (accum.tableRangeKey) {
            throw new SchemaValidationError(
              `${schemaName} is invalid: multiple table range keys ("${accum.tableRangeKey}" and "${keyAttrName}").`
            );
          }
          accum.tableRangeKey = keyAttrName;
        }

        // Check for index
        if (index) {
          // Ensure index has a name
          if (!index.name) {
            throw new SchemaValidationError(
              `Invalid TableKeysSchema: the index for attribute "${keyAttrName}" is missing a "name".`
            );
          }

          // See if "indexes" exists on accum yet
          if (!accum.indexes) {
            // If accum does not yet have "indexes", add it.
            accum.indexes = {};
            // Else ensure the index name is unique
          } else if (hasKey(accum.indexes, index.name)) {
            throw new SchemaValidationError(
              `${schemaName} is invalid: multiple indexes with the same name ("${index.name}").`
            );
          }

          accum.indexes[index.name] = {
            name: index.name,
            type: index?.global === true ? "GLOBAL" : "LOCAL",
            indexPK: keyAttrName,
            ...(index?.rangeKey && { indexSK: index.rangeKey }),
          };
        }
        return accum;
      },
      {} // <-- initial accum
    );

    // Ensure table hashKey and rangeKey exist
    if (!tableHashKey || !tableRangeKey) {
      const { keyType, keyConfig } = !tableHashKey
        ? { keyType: "hash", keyConfig: "isHashKey" }
        : { keyType: "range", keyConfig: "isRangeKey" };
      throw new SchemaValidationError(
        `${schemaName} is invalid: the schema does not contain a ${keyType} key (must specify exactly one attribute with "${keyConfig}: true").`
      );
    }

    return {
      tableHashKey,
      ...(tableRangeKey && { tableRangeKey }),
      ...(indexes && { indexes }),
    };
  };

  /**
   * This function returns a ModelSchema with attributes and attribute-configs merged in from the
   * provided TableKeysSchema, thereby preventing the need to repeat key/index attribute configs in
   * every ModelSchema. Note that when using this "Partial ModelSchema" approach, the schema object
   * provided to the `ItemTypeFromSchema` generic must be the "complete" ModelSchema returned from
   * this function to ensure correct item typing.
   *
   * For ModelSchema in which it's desirable to include key/index attributes (e.g., to define a
   * Model-specific `"alias"`), please note the table below that oulines which attribute-configs
   * may be included and/or customized.
   *
   * | Key/Index Attribute Config | Can Include in ModelSchema | Can Customize in ModelSchema |
   * | :------------------------- | :------------------------: | :--------------------------: |
   * | `alias`                    |             ✅             |              ✅             |
   * | `default`                  |             ✅             |              ✅             |
   * | `transformValue`           |             ✅             |              ✅             |
   * | `validate`                 |             ✅             |              ✅             |
   * | `type`                     |             ✅             |              ❌             |
   * | `required`                 |             ✅             |              ❌             |
   * | `isHashKey`                |             ❌             |              ❌             |
   * | `isRangeKey`               |             ❌             |              ❌             |
   * | `index`                    |             ❌             |              ❌             |
   *
   * > Note: `schema` and `oneOf` are not included in the table above, as they are not valid for
   *   key/index attributes which must be of type "string", "number", or "Buffer".
   *
   * @param tableKeysSchema - The TableKeysSchema to merge into the ModelSchema.
   * @param modelSchema - The ModelSchema to merge the TableKeysSchema into.
   * @throws {@link SchemaValidationError} - If the provided ModelSchema contains invalid key/index attribute configs.
   */
  static readonly getMergedModelSchema = <
    TableKeysSchema extends TableKeysSchemaType,
    ModelSchema extends ModelSchemaType<TableKeysSchema>,
  >({
    tableKeysSchema,
    modelSchema,
  }: {
    tableKeysSchema: TableKeysSchema;
    modelSchema: ModelSchema;
  }): MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema> => {
    const mergedModelSchema: Record<string, Record<string, any>> = { ...modelSchema };

    for (const keyAttrName in tableKeysSchema) {
      const { isHashKey, isRangeKey, index, ...keyAttrConfig } = tableKeysSchema[keyAttrName];

      // Check if ModelSchema contains keyAttrName
      if (hasKey(modelSchema, keyAttrName)) {
        // If ModelSchema contains keyAttrName, check if it contains mergeable config properties.
        (["type", "required"] satisfies Array<keyof BaseAttributeConfig>).forEach(
          (attrConfigName) => {
            if (hasKey(modelSchema[keyAttrName] as any, attrConfigName)) {
              // If ModelSchema contains `keyAttrName` AND a mergeable property, ensure it matches TableKeysSchema.
              if (modelSchema[keyAttrName][attrConfigName] !== keyAttrConfig[attrConfigName]) {
                // Throw error if ModelSchema key attrConfig has a config mismatch
                throw new SchemaValidationError(
                  `Invalid "${attrConfigName}" value found in ModelSchema for key attribute ` +
                    `"${keyAttrName}" does not match the value provided in the TableKeysSchema.`
                );
              }
            } else {
              // If ModelSchema contains `keyAttrName`, but NOT a mergeable config property, add it.
              mergedModelSchema[keyAttrName][attrConfigName] = keyAttrConfig[attrConfigName];
            }
          }
        );
      } else {
        // If ModelSchema does NOT contain keyAttrName, add it.
        mergedModelSchema[keyAttrName] = keyAttrConfig;
      }
    }

    // Ensure the returned schema doesn't contain configs which are only valid in the TableKeysSchema.
    for (const attrName in mergedModelSchema) {
      (["isHashKey", "isRangeKey", "index"] satisfies Array<keyof KeyAttributeConfig>).forEach(
        (attrConfigName) => {
          if (hasKey(mergedModelSchema[attrName], attrConfigName)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete mergedModelSchema[attrName][attrConfigName];
          }
        }
      );
    }

    return mergedModelSchema as MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>;
  };
}
