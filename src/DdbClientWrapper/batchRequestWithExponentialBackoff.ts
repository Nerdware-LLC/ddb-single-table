import { isString, isArray, safeJsonStringify } from "@nerdware/ts-type-safety-utils";
import { DdbSingleTableError } from "../utils/errors.js";
import type { BatchRequestFunction, BatchRetryExponentialBackoffConfigs } from "./types/index.js";
import type {
  BatchStatementError,
  BatchStatementErrorCodeEnum as BatchErrorCode,
} from "@aws-sdk/client-dynamodb";

/**
 * This DynamoDB batch-requests helper handles submission and retry logic for batch
 * operations like `BatchGetItem` and `BatchWriteItem`.
 *
 * It works by recursively invoking the provided `submitBatchRequest` function, which
 * must return any `UnprocessedItems` or `UnprocessedKeys` from the DDB batch operation.
 *
 * > To disable the delay between retries, set `initialDelay` to `0`.
 *
 * ### **Exponential Backoff Strategy:**
 *
 *   1. First request: no delay
 *   2. Second request: delay `initialDelay` milliseconds (default: `100`)
 *   3. All subsequent request delays are equal to the previous delay multiplied by the
 *      `timeMultiplier` (default: `2`), until either:
 *      - The `maxRetries` limit is reached (default: `10`), or
 *      - The `maxDelay` limit is reached (default: `3500`, or 3.5 seconds)
 *
 *      Ergo, the base `delay` calculation can be summarized as follows:
 *        > `initialDelay * timeMultiplier^attemptNumber milliseconds`
 *
 *      If `useJitter` is true (default: `false`), the `delay` is randomized by applying
 *      the following to the base `delay`: `Math.round(Math.random() * delay)`. Note that
 *      the determination as to whether the delay exceeds the `maxDelay` is made BEFORE
 *      jitter is applied.
 *
 * @param submitBatchRequest A fn which invokes a DDB batch operation and returns any `UnprocessedItems`/`UnprocessedKeys`.
 * @param batchRequestObjects The array of request objects to submit via the batch operation.
 * @param exponentialBackoffConfigs Configs for the exponential backoff retry strategy.
 * @param attemptNumber The current attempt number.
 */
export const batchRequestWithExponentialBackoff = async <
  BatchRequestObjectType extends object = Record<string, unknown>,
  BatchFn extends
    BatchRequestFunction<BatchRequestObjectType> = BatchRequestFunction<BatchRequestObjectType>,
>(
  submitBatchRequest: BatchFn,
  batchRequestObjects: Array<BatchRequestObjectType>,
  {
    initialDelay = 100,
    timeMultiplier = 2, // By default, double the delay each time
    maxRetries = 10,
    maxDelay = 3500,
    useJitter = false,
  }: BatchRetryExponentialBackoffConfigs = {},
  numPreviousRetries = 0
): Promise<void> => {
  // Init variable to hold UnprocessedItems/UnprocessedKeys
  let unprocessedRequestObjects: Array<BatchRequestObjectType> | undefined;

  try {
    // Submit the batch request
    unprocessedRequestObjects = await submitBatchRequest(batchRequestObjects);
  } catch (err) {
    // If a batch op throws, NONE of the requests were successful, check if `err.Code` is retryable.
    const maybeErrCode = (err as BatchStatementError | undefined)?.Code;
    if (!isString(maybeErrCode) || !RETRYABLE_BATCH_ERROR_CODES[maybeErrCode]) throw err;
    // If `err.Code` indicates the op should be retried, run again with all batchRequestObjects.
    unprocessedRequestObjects = batchRequestObjects;
  }

  if (isArray(unprocessedRequestObjects) && unprocessedRequestObjects.length > 0) {
    // Determine the next `numPreviousRetries` and the delay before the next attempt
    const retryCount = numPreviousRetries + 1;
    // The delay is calculated as: initialDelay * timeMultiplier^retryCount milliseconds
    let delay = initialDelay * timeMultiplier ** retryCount;

    // If the next attempt would exceed maxRetries OR maxDelay, throw an error.
    if (retryCount > maxRetries || delay > maxDelay) {
      throw new DdbSingleTableError(
        `After several attempts, ${unprocessedRequestObjects.length} batch requests were `
          + `still unable to be processed due to insufficient provisioned throughput: `
          + safeJsonStringify(unprocessedRequestObjects)
      );
    }

    // Apply "randomness" to the delay if `useJitter` is true
    if (useJitter) delay = Math.round(Math.random() * delay);

    // Wait `delay` milliseconds, then retry the operation with the unprocessed items
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });

    // Recursive retries
    await batchRequestWithExponentialBackoff(
      submitBatchRequest,
      unprocessedRequestObjects,
      { initialDelay, timeMultiplier, maxRetries, maxDelay, useJitter },
      retryCount
    );
  }
};

/**
 * A map of {@link BatchErrorCode|DDB batch-statement error codes}
 * which indicate a batch request should be retried.
 *
 * > See [DynamoDB — Error messages and codes][docs]
 * >
 * > Note: these error codes are all HTTP 400 errors.
 *
 * [docs]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes
 */
const RETRYABLE_BATCH_ERROR_CODES: Readonly<
  { [Code in BatchErrorCode]?: boolean } & { [key: string]: boolean }
> = {
  // Applicable to PROVISIONED BillingMode:
  ProvisionedThroughputExceeded: true,
  // Applicable to PAY_PER_REQUEST BillingMode:
  RequestLimitExceeded: true,
};
