import { isString, isArray, safeJsonStringify } from "@nerdware/ts-type-safety-utils";
import { DdbSingleTableError } from "../utils/errors.js";
import type { BatchRequestFunction, BatchRetryExponentialBackoffConfigs } from "./types.js";

/**
 * This DynamoDB batch-requests helper handles submission and retry logic for batch operations like
 * `BatchGetItem` and `BatchWriteItem`.
 *
 * It is a recursive function which takes a `submitBatchRequest` function, an array of batch
 * request objects, and a `BatchRetryExponentialBackoffConfigs` object.
 *
 * The `submitBatchRequest` function must take an array of batch request objects, submit them by
 * providing the appropriate DDB command to the DDB client's `send` method, and return any
 * `UnprocessedItems`/`UnprocessedKeys`.
 *
 * ### **Exponential Backoff Strategy:**
 *
 *   1. First request: no delay
 *   2. Second request: delay `initialDelay` milliseconds (default: 100)
 *   3. All subsequent request delays are equal to the previous delay multiplied by the
 *      `timeMultiplier` (default: 2), until either:
 *      - The `maxRetries` limit is reached (default: 10), or
 *      - The `maxDelay` limit is reached (default: 3500, or 3.5 seconds)
 *
 *      Ergo, the base `delay` calculation can be summarized as follows:
 *        > `initialDelay * timeMultiplier^attemptNumber milliseconds`
 *
 *      If `useJitter` is true (default: false), the `delay` is randomized by applying the following
 *      to the base `delay`: `Math.round(Math.random() * delay)`. Note that the determination as to
 *      whether the delay exceeds the `maxDelay` is made BEFORE the jitter is applied.
 *
 * @param submitBatchRequest A function which submits a DDB batch operation, and returns any `UnprocessedItems`/`UnprocessedKeys`.
 * @param batchRequestObjects The array of request objects to submit via the batch operation.
 * @param exponentialBackoffConfigs Configs for the exponential backoff retry strategy.
 * @param attemptNumber The current attempt number.
 */
export const batchRequestWithExponentialBackoff = async <BatchFn extends BatchRequestFunction>(
  submitBatchRequest: BatchFn,
  batchRequestObjects: Array<Record<string, unknown>>,
  {
    initialDelay = 100,
    timeMultiplier = 2, // By default, double the delay each time
    maxRetries = 10,
    maxDelay = 3500,
    useJitter = false,
  }: BatchRetryExponentialBackoffConfigs = {},
  attemptNumber = 1
): Promise<void> => {
  // Init variable to hold UnprocessedItems/UnprocessedKeys
  let unprocessedRequestObjects: Array<Record<string, unknown>> | undefined;

  try {
    // Submit the batch request
    unprocessedRequestObjects = await submitBatchRequest(batchRequestObjects);
  } catch (err) {
    // If a batch op throws, NONE of the requests were successful, check if `err.code` is retryable.
    const maybeErrCode = (err as any)?.code as unknown;
    if (!isString(maybeErrCode) || !ERR_CODE_SHOULD_RETRY[maybeErrCode]) throw err;
    // If `err.code` indicates the op should be retried, run again with all batchRequestObjects.
    unprocessedRequestObjects = batchRequestObjects;
  }

  if (isArray(unprocessedRequestObjects) && unprocessedRequestObjects.length > 0) {
    // Determine the next `attemptNumber` and the delay before the next attempt
    const nextAttemptNumber = attemptNumber + 1;
    // The delay is calculated as: initialDelay * timeMultiplier^attemptNumber milliseconds
    let delay = initialDelay * timeMultiplier ** attemptNumber;

    // If the next attempt would exceed maxRetries OR maxDelay, throw an error.
    if (nextAttemptNumber > maxRetries || delay > maxDelay) {
      throw new DdbSingleTableError(
        `After several attempts, ${unprocessedRequestObjects.length} batch requests were ` +
          `still unable to be processed due to insufficient provisioned throughput: ` +
          safeJsonStringify(unprocessedRequestObjects)
      );
    }

    // Apply "randomness" to the delay if `useJitter` is true
    if (useJitter) delay = Math.round(Math.random() * delay);

    // Wait `delay` milliseconds, then retry the operation with the unprocessed items
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });

    // Recursive retries
    return await batchRequestWithExponentialBackoff(
      submitBatchRequest,
      unprocessedRequestObjects,
      { initialDelay, timeMultiplier, maxRetries, maxDelay, useJitter },
      nextAttemptNumber
    );
  }
};

/**
 * A map of [DDB error codes][ddb-docs-errors] which indicate that a batch request should be
 * retried. Known error codes which do _not_ indicate a request should be retried, such as
 * `AccessDeniedException`, have been excluded from this map.
 *
 * > Note: these error codes are all HTTP 400 errors.
 *
 * [ddb-docs-errors]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes
 *
 * @see [DynamoDB Docs: Error messages and codes][ddb-docs-errors]
 * @internal
 */
const ERR_CODE_SHOULD_RETRY: Record<string, boolean> = {
  // Applicable to PROVISIONED BillingMode:
  ProvisionedThroughputExceeded: true,
  ProvisionedThroughputExceededException: true, // <-- SDK should auto-retry
  // Applicable to PAY_PER_REQUEST BillingMode:
  RequestLimitExceeded: true,
} as const;
