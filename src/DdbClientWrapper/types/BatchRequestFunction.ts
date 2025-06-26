import type { BatchGetItemInput, WriteRequest } from "@aws-sdk/client-dynamodb";

// Re-exported for convenience:
export type { WriteRequest } from "@aws-sdk/client-dynamodb";

/**
 * A `Keys` object for a `BatchGetItem` operation (this type is inlined in the SDK).
 */
export type GetRequest = NonNullable<
  NonNullable<BatchGetItemInput["RequestItems"]>[string]["Keys"]
>[number];

/**
 * A union of all possible batch-request objects.
 */
export type SomeBatchRequestObject = GetRequest | WriteRequest;

/**
 * A fn which takes an array of batch-request objects, submits them by invoking a DDB
 * batch operation command, and returns any `UnprocessedItems` or `UnprocessedKeys`.
 * These functions are provided as arguments to the `handleBatchRequests` helper.
 *
 * @example
 * ```ts
 * // Here's an example using the `BatchGetItemCommand` operation:
 * const submitBatchGetItemRequest: BatchRequestFunction<GetRequest> = async (
 *   batchGetItemReqObjects
 * ) => {
 *   const response = await ddbClient.send(
 *     new BatchGetItemCommand({
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
 * const unprocessedKeys = await handleBatchRequests(
 *   submitBatchGetRequest,
 *   fooArrayOfKeys,
 *   fooBatchConfigs
 * );
 * ```
 */
export type BatchRequestFunction<BatchRequestObject extends SomeBatchRequestObject> = (
  batchRequestObjects: Array<BatchRequestObject>
) => Promise<
  | Array<BatchRequestObject> // UnprocessedKeys or UnprocessedItems
  | undefined
>;
