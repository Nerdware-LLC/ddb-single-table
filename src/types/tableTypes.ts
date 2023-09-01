export type DdbSdkTableProperties = {
  billingMode?: "PROVISIONED" | "PAY_PER_REQUEST";
  provisionedThroughput?: {
    read: number;
    write: number;
  };
  // IDEA Add CreateTable params: "SSESpecification", "StreamSpecification", "TableClass".
};

/**
 * This type includes table properties set by the SDK, as well as configs that
 * are used by the DdbSingleTable class to control `ddb-single-table` behavior.
 */
export type DdbTableConfigs = DdbSdkTableProperties & {
  createIfNotExists: boolean;
};
    name: string;
    type: "GLOBAL" | "LOCAL";
    indexPK: string;
    indexSK?: string;
  }
>;
