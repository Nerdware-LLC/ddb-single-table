import type { TableKeysAndIndexes } from "../../Table/types/TableKeysAndIndexes.js";

/**
 * Represents the key attributes used in a DynamoDB query (partition key and optional sort key).
 */
export type QueryKeyAttributes = {
  pkAttrName: string;
  skAttrName?: string;
};

/**
 * Infers the name of a DynamoDB index based on the provided query key attributes.
 * @returns The index name if a matching index is found, otherwise returns undefined.
 */
export const inferIndexName = (
  /** Runtime `Query` key-attribute names to match against the table's indexes. */
  { pkAttrName, skAttrName }: QueryKeyAttributes,
  /** A map of the table's indexes to search for a matching index. */
  indexes: TableKeysAndIndexes["indexes"]
) => {
  // Get IndexName by searching table's indexes for matching PK+SK
  for (const indexName in indexes) {
    if (
      pkAttrName === indexes[indexName].indexPK
      && (!skAttrName || skAttrName === indexes[indexName].indexSK)
    ) {
      return indexName;
    }
  }
};
