import type { DdbClientWrapperConstructorParameters } from "../../DdbClientWrapper/index.js";
import type { TableKeysSchemaType } from "../../Schema/types/index.js";
import type { Simplify } from "type-fest";

/**
 * Constructor parameters for creating a new `Table` instance.
 */
export type TableConstructorParameters<
  TableKeysSchema extends TableKeysSchemaType = TableKeysSchemaType,
> = Simplify<
  DdbClientWrapperConstructorParameters & {
    /** The schema of the table's primary and sort keys. */
    tableKeysSchema: TableKeysSchema;
    /** A custom function to use for logging (defaults to `console.info`). */
    logger?: TableLogFn;
  }
>;

/**
 * A custom function to use for logging (defaults to `console.info`).
 */
export type TableLogFn = (str: string) => void;
