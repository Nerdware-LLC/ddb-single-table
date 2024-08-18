import { DdbSingleTableError } from "../utils/errors.js";
import type { CreateTableInput } from "../DdbClientWrapper/types.js";
import type { TableKeysSchemaType } from "../Schema/types.js";
import type { TableInstance, TableCreateTableParameters } from "./types.js";

/**
 * [`CreateTable`][ddb-docs-create-table] operation wrapper which uses the provided
 * `tableKeysSchema` to form the `CreateTable` arguments listed below. All other `CreateTable`
 * arguments can be provided to this method.
 *
 * - `AttributeDefinitions`
 * - `KeySchema`
 * - `GlobalSecondaryIndexes`
 * - `LocalSecondaryIndexes`
 *
 * [ddb-docs-create-table]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
 *
 * @param createTableArgs `CreateTable` arguments to pass to the AWS SDK.
 * @returns The response from the `CreateTable` operation.
 * @throws `DdbSingleTableError` if `BillingMode` is "PAY_PER_REQUEST" and `ProvisionedThroughput` is provided.
 */
export const createTable = async function <TableKeysSchema extends TableKeysSchemaType>(
  this: TableInstance<TableKeysSchema>,
  createTableArgs: TableCreateTableParameters = {}
) {
  // If createTableArgs were provided, provide some minor early validation:
  if (
    createTableArgs?.BillingMode === "PAY_PER_REQUEST" &&
    !!createTableArgs?.ProvisionedThroughput
  ) {
    throw new DdbSingleTableError(
      `Invalid "createTable" args: "ProvisionedThroughput" should not be provided when "BillingMode" is "PAY_PER_REQUEST".`
    );
  }

  const AttributeDefinitions: CreateTableInput["AttributeDefinitions"] = [];
  const KeySchema: CreateTableInput["KeySchema"] = [];
  const GlobalSecondaryIndexes: CreateTableInput["GlobalSecondaryIndexes"] = [];
  const LocalSecondaryIndexes: CreateTableInput["LocalSecondaryIndexes"] = [];

  // Make `CreateTable` args from the `tableKeysSchema` provided to the `Table` constructor
  for (const keyAttrName in this.tableKeysSchema) {
    const keyAttrConfig = this.tableKeysSchema[keyAttrName];

    const {
      type: keyAttrType,
      isHashKey: isTableHashKey = false,
      isRangeKey: isTableRangeKey = false,
      index,
    } = keyAttrConfig;

    AttributeDefinitions.push({
      AttributeName: keyAttrName,
      AttributeType: keyAttrType === "string" ? "S" : keyAttrType === "number" ? "N" : "B",
      // keys can only be strings, numbers, or binary
    });

    // Table hash+range keys
    if (isTableHashKey || isTableRangeKey) {
      KeySchema.push({
        AttributeName: keyAttrName,
        KeyType: isTableHashKey === true ? "HASH" : "RANGE",
      });
    }

    // Indexes
    if (index) {
      // Determine GSI or LSI, then push to the respective array
      const indexArray = index?.global === true ? GlobalSecondaryIndexes : LocalSecondaryIndexes;

      indexArray.push({
        IndexName: index.name,
        KeySchema: [
          {
            AttributeName: keyAttrName,
            KeyType: "HASH",
          },
          ...(index?.rangeKey
            ? [{ AttributeName: index.rangeKey, KeyType: "RANGE" as const }]
            : []),
        ],
        Projection: {
          ProjectionType: !index?.project // if undefined or false, default "KEYS_ONLY"
            ? "KEYS_ONLY"
            : index.project === true
              ? "ALL"
              : "INCLUDE",
          ...(Array.isArray(index.project) && { NonKeyAttributes: index.project }),
        },
        ...(!!index?.throughput && {
          ProvisionedThroughput: {
            ReadCapacityUnits: index.throughput.read,
            WriteCapacityUnits: index.throughput.write,
          },
        }),
      });
    }
  }

  // Create the table
  return await this.ddbClient.createTable({
    TableName: this.tableName,
    ...createTableArgs,
    AttributeDefinitions,
    KeySchema,
    GlobalSecondaryIndexes,
    LocalSecondaryIndexes,
  });
};
