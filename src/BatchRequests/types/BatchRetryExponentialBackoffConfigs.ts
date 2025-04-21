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
