import {
  BatchStatementErrorCodeEnum as BatchErrorCode,
  ProvisionedThroughputExceededException,
  type BatchStatementError,
} from "@aws-sdk/client-dynamodb";
import { DdbSingleTableError } from "../utils/errors.js";
import { batchRequestWithExponentialBackoff } from "./batchRequestWithExponentialBackoff.js";
import type { WriteRequest } from "./types/index.js";

describe("batchRequestWithExponentialBackoff()", () => {
  afterEach(() => vi.useRealTimers());

  const mockSubmitBatchRequest = vi.fn();

  const mockBatchRequestObjects: Array<WriteRequest> = [1, 2, 3].map((num) =>
    num % 2 === 0
      ? { PutRequest: { Item: { id: { N: `${num}` } } } }
      : { DeleteRequest: { Key: { id: { N: `${num}` } } } }
  );

  const getDdbBatchError = (errCode: keyof typeof BatchErrorCode): Error & BatchStatementError => {
    return Object.defineProperty(new Error(errCode), "Code", { value: errCode });
  };

  test("successfully processes all batch requests without retries", async () => {
    // Arrange a simulated successful batch request with no unprocessed items
    mockSubmitBatchRequest.mockResolvedValueOnce([]);

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, mockBatchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledExactlyOnceWith(mockBatchRequestObjects);
  });

  test("retries unprocessed items and eventually succeeds", async () => {
    // Arrange unprocessed items returned from the first call
    const unprocessedItems = mockBatchRequestObjects.slice(-1);

    mockSubmitBatchRequest
      .mockResolvedValueOnce(unprocessedItems) // 1st call returns unprocessed items
      .mockResolvedValueOnce([]); //              2nd call returns no unprocessed items

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, mockBatchRequestObjects, {
        disableDelay: true,
      })
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(2);
    expect(mockSubmitBatchRequest).toHaveBeenNthCalledWith(1, mockBatchRequestObjects);
    expect(mockSubmitBatchRequest).toHaveBeenNthCalledWith(2, unprocessedItems);
  });

  test(`returns unprocessed request objects after exceeding maxRetries if "shouldThrowOnConstraintViolation" is false`, async () => {
    // Arrange the mock fn to always return unprocessed items until maxRetries is reached
    mockSubmitBatchRequest.mockResolvedValue(mockBatchRequestObjects);

    const result = await batchRequestWithExponentialBackoff(
      mockSubmitBatchRequest,
      mockBatchRequestObjects,
      {
        maxRetries: 3,
        disableDelay: true,
        shouldThrowOnConstraintViolation: false,
      }
    );

    // Assert that the fn returned the unprocessed request objects
    expect(result).toStrictEqual(mockBatchRequestObjects);
    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  test(`throws an error after exceeding maxRetries if "shouldThrowOnConstraintViolation" is true`, async () => {
    // Arrange the mock fn to always return unprocessed items until maxRetries is reached
    mockSubmitBatchRequest.mockResolvedValue(mockBatchRequestObjects);

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, mockBatchRequestObjects, {
        maxRetries: 3,
        disableDelay: true,
        shouldThrowOnConstraintViolation: true,
      })
    ).rejects.toThrow(DdbSingleTableError);

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  test("applies jitter to the delay if useJitter is true", async () => {
    // Arrange a spy on Math.random to ensure it's invoked when useJitter is true:
    const mockMathRandomValue = 0.35;
    const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(mockMathRandomValue);
    // Arrange a spy on setTimeout to check the `delay` value:
    const setTimeoutSpy = vi
      .spyOn(global, "setTimeout") // Just call the cb immediately:
      .mockImplementationOnce((cb) => cb() as any); // eslint-disable-line @typescript-eslint/no-unsafe-return

    mockSubmitBatchRequest
      .mockResolvedValueOnce(mockBatchRequestObjects) // return unprocessed items to trigger delay calculation
      .mockResolvedValueOnce([]);

    // Set highly-indicative initialDelay and timeMultiplier values for testing:
    const initialDelay = 333;
    const timeMultiplier = 2;

    const expectedDelay = Math.round(mockMathRandomValue * (initialDelay * timeMultiplier ** 0));

    await batchRequestWithExponentialBackoff(mockSubmitBatchRequest, mockBatchRequestObjects, {
      useJitter: true,
      initialDelay,
      timeMultiplier,
    });

    // Assert that Math.random was called:
    expect(mathRandomSpy).toHaveBeenCalledOnce();
    // Assert that setTimeout was called with the expected delay:
    expect(setTimeoutSpy).toHaveBeenCalledExactlyOnceWith(expect.any(Function), expectedDelay);
  });

  test("throws an error if a non-retryable error occurs", async () => {
    const batchError = getDdbBatchError("AccessDenied");
    mockSubmitBatchRequest.mockRejectedValueOnce(batchError);

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, mockBatchRequestObjects)
    ).rejects.toThrow(batchError);

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(1);
  });

  test("retries if a retryable error occurs", async () => {
    // Arrange a retryable error (ProvisionedThroughputExceeded) on the first call
    mockSubmitBatchRequest
      .mockRejectedValueOnce(getDdbBatchError(BatchErrorCode.ProvisionedThroughputExceeded))
      .mockResolvedValueOnce([]);

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, mockBatchRequestObjects, {
        disableDelay: true,
      })
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(2);
  });

  test("recognizes SDK retry exceptions and uses initialDelay on the first retry", async () => {
    vi.useFakeTimers();

    const input = [{ pk: { S: "a" } }];
    const submit = vi
      .fn()
      .mockRejectedValueOnce(
        new ProvisionedThroughputExceededException({ message: "throttled", $metadata: {} })
      )
      .mockResolvedValueOnce(input)
      .mockResolvedValueOnce(undefined);

    const result = batchRequestWithExponentialBackoff(submit, input, { initialDelay: 100 });
    await vi.advanceTimersByTimeAsync(99);
    expect(submit).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(submit).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(199);
    expect(submit).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(submit).toHaveBeenCalledTimes(3);
  });
});
