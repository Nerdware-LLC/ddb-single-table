import { Table } from "./Table";
import { isPlainObject, isErrorObject, DdbSingleTableError, DdbConnectionError } from "../utils";
import type { TableKeysSchemaType } from "../Schema";
import type { EnsureTableIsActiveParams } from "./types";

/**
 * This method of the `Table` class is used to check if a DynamoDB table is active and
 * ready for use.
 *
 * The function checks the DDB table's status using the Table instance's `describeTable`
 * method. If the method returns a `ResourceNotFoundException`, the table does not exist.
 * If the table does not exist and `createIfNotExists` is set to `true`, the function
 * creates the table using the Table instance's `createTable` method - this function then
 * continues the process of waiting for the table to become active.
 *
 * Regardless of whether the table initially existed or not, if it is not active, the
 * function tries to connect to it again after `frequency` number of seconds have passed
 * until either the table is active, or `maxRetries` number of attempts have been made,
 * or `timeout` number of seconds have passed.
 */
export const ensureTableIsActive = async function <TableKeysSchema extends TableKeysSchemaType>(
  this: InstanceType<typeof Table<TableKeysSchema>>,
  {
    timeout: timeoutSeconds = 30,
    frequency: frequencySeconds = 1,
    maxRetries = 20,
    createIfNotExists = false,
  }: EnsureTableIsActiveParams = {}
) {
  // Get timeout and frequency in milliseconds for use in setTimeout calls
  const timeoutMilliseconds = timeoutSeconds * 1000;
  const frequencyMilliseconds = frequencySeconds * 1000;

  // Start timeout timer that throws error if not cleared within the timeframe.
  const timeoutTimerID = setTimeout(() => {
    throw new DdbSingleTableError(
      `ensureTableIsActive has timed out after ${timeoutSeconds} seconds.`
    );
  }, timeoutMilliseconds);

  // Local state var to ensure CreateTable isn't called more than once.
  let hasCreateTableBeenCalled = false;

  // Try to get TableStatus, ensure it's ACTIVE.
  for (let i = 0; i < maxRetries; i++) {
    try {
      // DescribeTable will throw if Table doesn't exist
      const response = await this.describeTable();

      const tableStatus = response?.Table?.TableStatus;

      if (tableStatus === "ACTIVE") {
        clearTimeout(timeoutTimerID);
        this.isTableActive = true;
        break;
      }

      this.logger(
        `Table "${this.tableName}" is not ACTIVE. Current table status: ${tableStatus ?? "UNKNOWN"}`
      );

      // Wait `frequencyMilliseconds`, then try again
      await new Promise((resolve) => {
        setTimeout(resolve, frequencyMilliseconds);
      });
    } catch (err: unknown) {
      // Sanity type-check: ensure `err` is an object.
      if (!isErrorObject(err) && !isPlainObject(err)) throw err;

      // If `err?.code` is "ECONNREFUSED", a connection could not be made to the provided endpoint.
      if ((err as { code?: unknown })?.code === "ECONNREFUSED") throw new DdbConnectionError(err);

      // If `err` is a "ResourceNotFoundException", Table doesn't exist - see if it should be created.
      if (err?.name !== "ResourceNotFoundException") throw err;

      // If Table doesn't exist AND !createIfNotExists, throw error.
      if (!createIfNotExists) {
        throw new DdbSingleTableError(
          `Table "${this.tableName}" not found. To have the table created automatically when ` +
            `DynamoDB returns a "ResourceNotFoundException", set "createIfNotExists" to true.`
        );
      }

      // Inform user the Table doesn't exist.
      this.logger(`Table "${this.tableName}" not found.`);

      // If createTable has already been called, continue the for-loop.
      if (hasCreateTableBeenCalled === true) continue;

      // Else attempt to create the Table.
      this.logger(`Creating Table "${this.tableName}" ...`);

      // Create the table (provide `createIfNotExists` if it's a `tableConfigs` object)
      const response = await this.createTable(
        isPlainObject(createIfNotExists) ? createIfNotExists : undefined
      );

      // Get the TableStatus from the response
      const tableStatus = response?.TableDescription?.TableStatus;

      // Update this bool flag so ensure CreateTable is only ever called once.
      hasCreateTableBeenCalled = true;

      this.logger(
        `CreateTable operation complete. Current table status: ${tableStatus ?? "UNKNOWN"}`
      );

      // TableStatus is possibly already ACTIVE if using ddb-local.
      if (tableStatus === "ACTIVE") {
        clearTimeout(timeoutTimerID);
        this.isTableActive = true;
        break;
      }
    }
  }
};
