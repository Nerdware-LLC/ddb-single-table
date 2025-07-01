import type { ClientWrapperCreateTableInput } from "../../DdbClientWrapper/types/index.js";
import type { Simplify, Except } from "type-fest";

/**
 * Parameters for the `table.createTable()` method.
 */
export type CreateTableParameters = Simplify<
  Except<
    ClientWrapperCreateTableInput,
    | "KeySchema" //              ascertained from the TableKeysSchema
    | "AttributeDefinitions" //   ascertained from the TableKeysSchema
    | "GlobalSecondaryIndexes" // ascertained from the TableKeysSchema
    | "LocalSecondaryIndexes" //  ascertained from the TableKeysSchema
  >
>;
