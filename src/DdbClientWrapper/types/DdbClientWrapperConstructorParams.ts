import type { TableConstructorParams } from "../../Table/index.js";

/**
 * `DdbClientWrapper` class constructor params.
 */
export type DdbClientWrapperConstructorParams = Pick<
  TableConstructorParams,
  "ddbClient" | "tableName" | "marshallingConfigs"
>;
