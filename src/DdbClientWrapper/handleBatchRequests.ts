import { batchRequestWithExponentialBackoff } from "./batchRequestWithExponentialBackoff.js";
import type { BatchRetryExponentialBackoffConfigs, BatchRequestFunction } from "./types/index.js";

/**
 * This DynamoDB batch-requests handler invokes the provided `submitBatchRequest` function with
 * chunks of `batchRequestObjects` of size `chunkSize`. If the `submitBatchRequest` function
 * returns any `UnprocessedItems`/`UnprocessedKeys`, or if it results in a retryable error,
 * the batch request will be retried with any remaining unprocessed request objects using the
 * exponential-backoff strategy described below, the behavior of which can be customized via the
 * [`exponentialBackoffConfigs`][backoff-configs] parameter.
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
 * [backoff-configs]: {@link BatchRetryExponentialBackoffConfigs}
 *
 * @param submitBatchRequest A function which submits a DDB batch operation, and returns any `UnprocessedItems`/`UnprocessedKeys`.
 * @param batchRequestObjects The array of request objects to submit via the batch operation.
 * @param chunkSize The maximum limit set by AWS for the batch operation used in the `submitBatchRequest` function (e.g., `100` for `BatchGetItem`, `25` for `BatchWriteItem`).
 * @param exponentialBackoffConfigs Configs for the exponential-backoff retry strategy.
 */
export const handleBatchRequests = async <
  BatchRequestObjectType extends object = Record<string, unknown>,
  BatchFn extends
    BatchRequestFunction<BatchRequestObjectType> = BatchRequestFunction<BatchRequestObjectType>,
>(
  submitBatchRequest: BatchFn,
  batchRequestObjects: Parameters<BatchFn>[0],
  chunkSize: number,
  exponentialBackoffConfigs?: BatchRetryExponentialBackoffConfigs
) => {
  // Shallow copy the initial batch requests array:
  const remainingBatchRequests = [...batchRequestObjects];

  // Loop until all batch requests have been submitted:
  while (remainingBatchRequests.length > 0) {
    const batchRequestsChunk = remainingBatchRequests.splice(0, chunkSize);

    // Run `submitBatchRequest` with the recursive exponential-backoff wrapper
    await batchRequestWithExponentialBackoff(
      submitBatchRequest,
      batchRequestsChunk,
      exponentialBackoffConfigs
    );
  }
};
