/**
 * A config object specifying the `Table`'s keys and indexes.
 */
export type TableKeysAndIndexes = {
  tableHashKey: string;
  tableRangeKey?: string | undefined;
  /** A map of DynamoDB table index names to their respective config objects. */
  indexes?:
    | {
        [indexName: string]: {
          name: string;
          type: "GLOBAL" | "LOCAL";
          indexPK: string;
          indexSK?: string;
        };
      }
    | undefined;
};
