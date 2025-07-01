/**
 * A parameter for controlling batch-operation behavior.
 */
export type BatchConfigsParameter = {
  /** {@link BatchConfigs|Configs} for controlling batch-operation behavior. */
  batchConfigs?: BatchConfigs;
};

/**
 * Configs for controlling how batch operations are handled.
 */
export type BatchConfigs = {
  /**
   * An override for the default batch chunk-size:
   *
   * | Batch Operation &emsp; | Default/Maximum Chunk Size |
   * | :--------------------- | :------------------------- |
   * | `BatchGetItem`         |           `100`            |
   * | `BatchWriteItem`       |            `25`            |
   *
   * If provided, this value must be between `1` and the maximum allowed by AWS for the batch
   * operation used in the `submitBatchRequest` function (larger values will be ignored).
   */
  chunkSize?: number;
  retryConfigs?: BatchRetryConfigs;
};

/**
 * When it's necessary to retry a batch operation (`BatchGetItem` or `BatchWriteItem`), it is
 * retried using an exponential-backoff strategy which is configurable via these parameters.
 */
export type BatchRetryConfigs = {
  /** Set this to `true` to disable the delay between retries (useful for testing purposes). */
  disableDelay?: boolean;
  /** The initial delay in milliseconds to wait before retrying a batch operation (default: `100`). */
  initialDelay?: number;
  /** The multiplier to apply to the previous delay to determine the next delay (default: 2). */
  timeMultiplier?: number;
  /** Whether to apply "randomness" to each delay (default: false). */
  useJitter?: boolean;
  /** The maximum number of retries to attempt (default: 10). */
  maxRetries?: number;
  /** The max delay in milliseconds to wait before retrying a batch operation (default: 3500, or 3.5 seconds). */
  maxDelay?: number;
  /**
   * By default, if `maxRetries` or `maxDelay` are exceeded, any unprocessed request objects
   * are simply returned to the caller. Set this to `true` to throw an error instead.
   */
  shouldThrowOnConstraintViolation?: boolean;
};
