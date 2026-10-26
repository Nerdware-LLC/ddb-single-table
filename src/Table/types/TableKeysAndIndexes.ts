/**
 * A config object specifying the `Table`'s keys and indexes.
 */
export type TableKeysAndIndexes = {
  tableHashKey: string;
  tableRangeKey?: string | undefined;
  /** An optional map of DynamoDB table index names to their respective config objects. */
  indexes?: TableIndexesMap | undefined;
};

/**
 * A map of DynamoDB table **index** names to their respective config objects.
 */
export type TableIndexesMap = {
  [indexName: string]: TableIndexConfig;
};

/**
 * A config object describing a DynamoDB table **index** (name, key attributes, etc.).
 */
export type TableIndexConfig = {
  name: string;
  type: "GLOBAL" | "LOCAL";
  indexPK: string;
  indexSK?: string;
};
