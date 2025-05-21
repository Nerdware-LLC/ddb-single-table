import {
  BatchStatementErrorCodeEnum as BatchErrorCode,
  type BatchStatementError,
} from "@aws-sdk/client-dynamodb";
import { DdbSingleTableError } from "../utils/errors.js";
import { batchRequestWithExponentialBackoff } from "./batchRequestWithExponentialBackoff.js";

describe("batchRequestWithExponentialBackoff()", () => {
  const mockSubmitBatchRequest = vi.fn();

  const getDdbBatchError = (errCode: keyof typeof BatchErrorCode): Error & BatchStatementError => {
    return Object.defineProperty(new Error(errCode), "Code", { value: errCode });
  };

  test("successfully processes all batch requests without retries", async () => {
    mockSubmitBatchRequest.mockResolvedValueOnce([]);
    const batchRequestObjects = [{ id: 1 }, { id: 2 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledExactlyOnceWith(batchRequestObjects);
  });

  test("retries unprocessed items and eventually succeeds", async () => {
    const unprocessedItems = [{ id: 2 }];

    mockSubmitBatchRequest
      .mockResolvedValueOnce(unprocessedItems) // 1st call returns unprocessed items
      .mockResolvedValueOnce([]); //              2nd call returns no unprocessed items

    const batchRequestObjects = [{ id: 1 }, { id: 2 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(2);
    expect(mockSubmitBatchRequest).toHaveBeenNthCalledWith(1, batchRequestObjects);
    expect(mockSubmitBatchRequest).toHaveBeenNthCalledWith(2, unprocessedItems);
  });

  test("throws an error after exceeding maxRetries", async () => {
    const batchRequestObjects = [{ id: 1 }];
    mockSubmitBatchRequest.mockResolvedValue([{ id: 1 }]);

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects, {
        maxRetries: 3,
        maxDelay: Number.POSITIVE_INFINITY, // Set a long maxDelay to trigger the maxRetries condition
      })
    ).rejects.toThrow(DdbSingleTableError);

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  test("applies jitter to the delay if useJitter is true", async () => {
    vi.spyOn(global, "setTimeout");
    mockSubmitBatchRequest.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([]);

    const batchRequestObjects = [{ id: 1 }];

    await batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects, {
      useJitter: true,
      initialDelay: 10,
    });

    expect(setTimeout).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  test("throws an error if a non-retryable error occurs", async () => {
    const batchError = getDdbBatchError("AccessDenied");
    mockSubmitBatchRequest.mockRejectedValueOnce(batchError);

    const batchRequestObjects = [{ id: 1 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).rejects.toThrow(batchError);

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(1);
  });

  test("retries if a retryable error occurs", async () => {
    const batchError = getDdbBatchError("ProvisionedThroughputExceeded");

    mockSubmitBatchRequest.mockRejectedValueOnce(batchError).mockResolvedValueOnce([]);

    const batchRequestObjects = [{ id: 1 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(2);
  });
});
