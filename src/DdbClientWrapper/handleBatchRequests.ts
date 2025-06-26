import { isArray } from "@nerdware/ts-type-safety-utils";
import { batchRequestWithExponentialBackoff } from "./batchRequestWithExponentialBackoff.js";
import type { BatchRequestFunction, SomeBatchRequestObject, BatchConfigs } from "./types/index.js";

/**
 * This DynamoDB batch-requests handler invokes the provided `submitBatchRequest` function with
 * chunks of `batchRequestObjects` of size `chunkSize`. If the `submitBatchRequest` function
 * returns any `UnprocessedItems`/`UnprocessedKeys`, or if it results in a retryable error,
 * the batch request will be retried with any remaining unprocessed request objects using the
 * exponential-backoff strategy described below, the behavior of which can be customized via the
 * {@link BatchConfigs|`batchConfigs`} parameter.
 *
 * ### **Chunk Size:**
 *
 * The `chunkSize` is determined automatically based on whether the `batchRequestObjects` are
 * `GetRequest` (100) or `WriteRequest` (25), since these are the maximum limits set by AWS for
 * the `BatchGetItem` and `BatchWriteItem` operations, respectively. If you need to override
 * this value for any reason, you can do so by providing a `chunkSize` property in the
 * {@link BatchConfigs|`batchConfigs`} parameter.
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
 * @param batchConfigs {@link BatchConfigs} for customizing batch-operation handling/behavior.
 */
export const handleBatchRequests = async <
  BatchRequestObj extends SomeBatchRequestObject,
  BatchFn extends BatchRequestFunction<BatchRequestObj> = BatchRequestFunction<BatchRequestObj>,
>(
  submitBatchRequest: BatchFn,
  batchRequestObjects: Array<BatchRequestObj>,
  { chunkSize: chunkSizeOverride, retryConfigs = {} }: BatchConfigs = {}
): Promise<Array<BatchRequestObj> | undefined> => {
  // Sanity check: ensure that the `batchRequestObjects` array is not empty
  if (batchRequestObjects.length === 0) return;

  // Simple heuristic to determine the batch-operation type (Get/Write):
  const isBatchWriteOp =
    Object.hasOwn(batchRequestObjects[0], "PutRequest")
    || Object.hasOwn(batchRequestObjects[0], "DeleteRequest");

  const maxChunkSize = isBatchWriteOp ? MAX_CHUNK_SIZE.WriteRequest : MAX_CHUNK_SIZE.GetRequest;

  const chunkSize = chunkSizeOverride
    ? Math.min(Math.max(1, chunkSizeOverride), maxChunkSize)
    : maxChunkSize;

  // Shallow copy the initial batch requests array:
  const remainingBatchRequests = [...batchRequestObjects];

  // This will hold any unprocessed batch requests that need to be returned:
  const unprocessedBatchRequestsToReturn: Array<BatchRequestObj> = [];

  // Loop until all batch requests have been submitted:
  while (remainingBatchRequests.length > 0) {
    const batchRequestsChunk = remainingBatchRequests.splice(0, chunkSize);

    /* Run `submitBatchRequest` with the recursive exponential-backoff wrapper,
      and collect any unprocessed requests returned by the function. */
    const unprocessedBatchRequestsFromChunk = await batchRequestWithExponentialBackoff(
      submitBatchRequest,
      batchRequestsChunk,
      retryConfigs
    );

    // If there are unprocessed requests, add them to the array to return:
    if (
      isArray(unprocessedBatchRequestsFromChunk)
      && unprocessedBatchRequestsFromChunk.length > 0
    ) {
      unprocessedBatchRequestsToReturn.push(...unprocessedBatchRequestsFromChunk);
    }
  }

  // If there are any unprocessed requests, return them:
  if (unprocessedBatchRequestsToReturn.length > 0) return unprocessedBatchRequestsToReturn;
};

/**
 * The maximum chunk sizes for DDB batch operations.
 */
export const MAX_CHUNK_SIZE = {
  GetRequest: 100,
  WriteRequest: 25,
} as const satisfies Record<string, number>;
