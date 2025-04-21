/**
 * A fn which takes an array of {@link BatchRequestObject|batch request objects}, submits them by
 * invoking a DDB batch operation command, and returns any `UnprocessedItems` or `UnprocessedKeys`.
 * These functions are provided as arguments to the `handleBatchRequests` helper.
 *
 * @example
 * ```ts
 * // Here's an example using the `BatchGetItem` operation command:
 * const submitBatchGetRequest = async (batchReqKeys: Array<BatchRequestObject>) => {
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
  batchRequestObjects: Array<Record<string, unknown>>
) => Promise<Array<Record<string, unknown>> | undefined>;
