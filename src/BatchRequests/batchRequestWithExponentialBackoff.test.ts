import { DdbSingleTableError } from "../utils/errors.js";
import { batchRequestWithExponentialBackoff } from "./batchRequestWithExponentialBackoff.js";

describe("batchRequestWithExponentialBackoff()", { timeout: 5_000 }, () => {
  const mockSubmitBatchRequest = vi.fn();

  test("successfully processes all batch requests without retries", async () => {
    mockSubmitBatchRequest.mockResolvedValueOnce([]);
    const batchRequestObjects = [{ id: 1 }, { id: 2 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(1);
    expect(mockSubmitBatchRequest).toHaveBeenCalledWith(batchRequestObjects);
  });

  test("retries unprocessed items and eventually succeeds", async () => {
    const unprocessedItems = [{ id: 2 }];
    mockSubmitBatchRequest.mockResolvedValueOnce(unprocessedItems).mockResolvedValueOnce([]);

    const batchRequestObjects = [{ id: 1 }, { id: 2 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(2);
    expect(mockSubmitBatchRequest).toHaveBeenNthCalledWith(1, batchRequestObjects);
    expect(mockSubmitBatchRequest).toHaveBeenNthCalledWith(2, unprocessedItems);
  });

  test("throws an error after exceeding maxRetries", { timeout: 5_000 }, async () => {
    mockSubmitBatchRequest.mockResolvedValue([{ id: 1 }]);
    const batchRequestObjects = [{ id: 1 }];

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
    const error = new Error("AccessDeniedException");
    (error as any).code = "AccessDeniedException";
    mockSubmitBatchRequest.mockRejectedValueOnce(error);

    const batchRequestObjects = [{ id: 1 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).rejects.toThrow(error);

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(1);
  });

  test("retries if a retryable error occurs", async () => {
    const error = new Error("ProvisionedThroughputExceeded");
    (error as any).code = "ProvisionedThroughputExceeded";
    mockSubmitBatchRequest.mockRejectedValueOnce(error).mockResolvedValueOnce([]);

    const batchRequestObjects = [{ id: 1 }];

    await expect(
      batchRequestWithExponentialBackoff(mockSubmitBatchRequest, batchRequestObjects)
    ).resolves.not.toThrow();

    expect(mockSubmitBatchRequest).toHaveBeenCalledTimes(2);
  });
});
