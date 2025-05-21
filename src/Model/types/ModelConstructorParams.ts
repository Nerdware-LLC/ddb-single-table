import { DdbClientWrapper } from "../../DdbClientWrapper/index.js";
import type { ModelSchemaOptions } from "../../Schema/types/index.js";
import type { TableKeysAndIndexes, TableConstructorParams } from "../../Table/types/index.js";
import type { Writable } from "type-fest";

/**
 * Constructor params for creating a new `Model` instance.
 */
export type ModelConstructorParams = Writable<
  TableKeysAndIndexes
    & ModelSchemaOptions
    & Pick<TableConstructorParams, "tableName"> & {
      ddb: DdbClientWrapper;
    }
>;
