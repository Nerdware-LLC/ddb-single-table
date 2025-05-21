import type { TableKeysSchemaType } from "../../Schema/types/index.js";
import type { Table } from "../Table.js";

/**
 * An instance of the {@link Table} class.
 */
export type TableInstance<TableKeysSchema extends TableKeysSchemaType> = InstanceType<
  typeof Table<TableKeysSchema>
>;
