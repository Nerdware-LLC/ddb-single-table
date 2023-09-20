/**
 * When it's necessary to retry a batch operation (`BatchGetItem` or `BatchWriteItem`), it is
 * retried using an exponential backoff strategy which is configurable via these parameters.
 */
export type BatchRetryExponentialBackoffConfigs = {
  /** The initial delay in milliseconds to wait before retrying a batch operation (default: 100). */
  initialDelay?: number;
  /** The multiplier to apply to the previous delay to determine the next delay (default: 2). */
  timeMultiplier?: number;
  /** The maximum number of retries to attempt (default: 10). */
  maxRetries?: number;
  /** The max delay in milliseconds to wait before retrying a batch operation (default: 3500, or 3.5 seconds). */
  maxDelay?: number;
  /** Whether to apply "randomness" to each delay (default: false). */
  useJitter?: boolean;
};

/**
 * A function which takes an array of batch request objects, submits them by invoking a DDB batch
 * operation command, and returns any `UnprocessedItems`/`UnprocessedKeys`. These functions are
 * provided as arguments to the `handleBatchRequests` helper function.
 *
 * @example
 * ```ts
 * // Here's an example using the `BatchGetItem` operation command:
 * const submitBatchGetRequest = async (batchReqKeys: Array<Record<string, unknown>>) => {
 *   const response = await ddbDocClient.send(
 *     new BatchGetCommand({
 *       RequestItems: {
 *         [fooTableName]: {
 *           Keys: batchReqKeys,
 *         },
 *       }.
 *     });
 *   );
 *   // For BatchGetItem, your fn should extract any returned items here:
 *   if (Array.isArray(response?.Responses?.[fooTableName])) {
 *     fooItemsArrayInOuterScope.push(response.Responses[fooTableName]);
 *   }
 *   // Your fn must return any unprocessed keys/items/requests:
 *   return response?.UnprocessedKeys?.[fooTableName]?.Keys;
 * };
 * // Then, invoke the helper function:
 * await handleBatchRequests(submitBatchGetRequest, fooArrayOfKeys, 100);
 * ```
 */
export type BatchRequestFunction = (
  batchReqs: Array<Record<string, unknown>>
) => Promise<Array<Record<string, unknown>> | undefined>;
