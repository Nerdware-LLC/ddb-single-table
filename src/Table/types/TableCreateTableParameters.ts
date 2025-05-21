import type { CreateTableInput } from "../../DdbClientWrapper/types/index.js";
import type { Simplify, Except } from "type-fest";

/**
 * Params for the `table.createTable()` method.
 */
export type TableCreateTableParameters = Simplify<
  Except<
    CreateTableInput,
    | "KeySchema" //              ascertained from the TableKeysSchema
    | "AttributeDefinitions" //   ascertained from the TableKeysSchema
    | "GlobalSecondaryIndexes" // ascertained from the TableKeysSchema
    | "LocalSecondaryIndexes" //  ascertained from the TableKeysSchema
  >
>;
