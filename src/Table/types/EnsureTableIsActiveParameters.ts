import type { CreateTableParameters } from "./CreateTableParameters.js";

/**
 * Parameters which govern the behavior of the `table.ensureTableIsActive()` method.
 */
export type EnsureTableIsActiveParameters = {
  /** The max number of attempts that should be made to connect to the table (default: 20). */
  maxRetries?: number;
  /** The number of seconds to wait in between connection attempts (default: 1). */
  frequency?: number;
  /** The number of seconds to wait until the fn throws a connection timeout error (default: 30). */
  timeout?: number;
  /**
   * Whether the table should be created if it does not yet exist. This can be an object with
   * `CreateTable` arguments, or `true` to create a table with default `CreateTable` arguments,
   * or `false` to disable table creation. If the table does not exist and this parameter is not
   * provided or is `false`, the function will throw an error.
   */
  createIfNotExists?: boolean | CreateTableParameters;
};
