import { DdbClientWrapper } from "../../DdbClientWrapper/index.js";
import type { ModelSchemaOptions } from "../../Schema/types/index.js";
import type { TableKeysAndIndexes, TableConstructorParameters } from "../../Table/types/index.js";
import type { Writable } from "type-fest";

/**
 * Constructor parameters for creating a new `Model` instance.
 */
export type ModelConstructorParameters = Writable<
  TableKeysAndIndexes
    & ModelSchemaOptions
    & Pick<TableConstructorParameters, "tableName"> & {
      ddb: DdbClientWrapper;
    }
>;
