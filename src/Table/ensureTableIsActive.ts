import { TableStatus, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import { isError, isPlainObject } from "@nerdware/ts-type-safety-utils";
import { DdbSingleTableError, DdbConnectionError } from "../utils/errors.js";
import type { TableInstance, EnsureTableIsActiveParameters } from "./types/index.js";
import type { TableKeysSchemaType } from "../Schema/types/index.js";

/**
 * This `Table` class method is used to check if a DynamoDB table is active and ready for use.
 *
 * The function checks the DDB table's status using the Table instance's `describeTable` method.
 * If the method returns a `ResourceNotFoundException`, the table does not exist. If the table
 * does not exist and `createIfNotExists` is set to `true`, the function creates the table using
 * the Table instance's `createTable` method — this function then continues the process of waiting
 * for the table to become active.
 *
 * Regardless of whether the table initially existed or not, if it is not active, the function
 * tries to connect to it again after `frequency` number of seconds have passed until either the
 * table is active, or `maxRetries` number of attempts have been made, or `timeout` number of
 * seconds have passed.
 *
 * The returned promise:
 * - _rejects_ on timeout, exhausted attempts, or a request failure
 * - _resolves_ only when ACTIVE
 */
export const ensureTableIsActive = async function <
  const TableKeysSchema extends TableKeysSchemaType,
>(
  this: TableInstance<TableKeysSchema>,
  {
    timeout: timeoutSeconds = 30,
    frequency: frequencySeconds = 1,
    maxRetries = 20,
    createIfNotExists = false,
  }: EnsureTableIsActiveParameters = {}
): Promise<void> {
  // Get timeout and frequency in milliseconds for use in setTimeout calls
  const timeoutMilliseconds = timeoutSeconds * 1000;
  const frequencyMilliseconds = frequencySeconds * 1000;

  let timeoutTimerID: NodeJS.Timeout | undefined;
  let pollingTimerID: NodeJS.Timeout | undefined;

  // Race each request and polling delay against the same operation-wide deadline.
  // A timed-out request may still settle, but cannot resume polling or mark the table active.
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutTimerID = setTimeout(() => {
      reject(
        new DdbSingleTableError(
          `ensureTableIsActive has timed out after ${timeoutSeconds} seconds.`
        )
      );
    }, timeoutMilliseconds);
  });

  const withTimeout = <T>(operation: Promise<T>): Promise<T> => {
    return Promise.race([timeoutPromise, operation]);
  };

  let hasCreateTableBeenCalled = false;

  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let tableStatus: TableStatus | undefined;

      try {
        const response = await withTimeout(this.describeTable());
        tableStatus = response.Table?.TableStatus;

        if (tableStatus !== TableStatus.ACTIVE) {
          this.logger(
            `Table "${this.tableName}" is not ACTIVE. Current table status: ${tableStatus ?? "UNKNOWN"}`
          );
        }
      } catch (err: unknown) {
        if (!isError(err) && !isPlainObject(err)) throw err;

        const { ECONNREFUSED } = DdbConnectionError.NODE_ERROR_CODES;

        if ((err as NodeJS.ErrnoException).code === ECONNREFUSED) throw new DdbConnectionError(err);

        if (err.name !== ResourceNotFoundException.name) throw err;

        if (!createIfNotExists) {
          throw new DdbSingleTableError(
            `Table "${this.tableName}" not found. To have the table created automatically when `
              + `DynamoDB returns a "ResourceNotFoundException", set "createIfNotExists" to true.`
          );
        }

        this.logger(`Table "${this.tableName}" not found.`);

        if (!hasCreateTableBeenCalled) {
          this.logger(`Creating Table "${this.tableName}" ...`);
          hasCreateTableBeenCalled = true;

          const response = await withTimeout(
            this.createTable(isPlainObject(createIfNotExists) ? createIfNotExists : undefined)
          );
          tableStatus = response.TableDescription?.TableStatus;

          this.logger(
            `CreateTable operation complete. Current table status: ${tableStatus ?? "UNKNOWN"}`
          );
        }
      }

      if (tableStatus === TableStatus.ACTIVE) {
        this.isTableActive = true;
        return;
      }

      // Wait between attempts, including while a newly created table is not yet visible.
      if (attempt + 1 < maxRetries) {
        await withTimeout(
          new Promise<void>((resolve) => {
            pollingTimerID = setTimeout(resolve, frequencyMilliseconds);
          })
        );
      }
    }

    throw new DdbSingleTableError(
      `Table "${this.tableName}" did not become ACTIVE after ${maxRetries} attempts.`
    );
  } finally {
    clearTimeout(timeoutTimerID);
    clearTimeout(pollingTimerID);
  }
};
