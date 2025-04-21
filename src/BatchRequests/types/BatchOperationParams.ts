import type { BatchRetryExponentialBackoffConfigs } from "./BatchRetryExponentialBackoffConfigs.js";

/**
 * Parameters for batch operations to control the retry-behavior of the batch-requests handler.
 */
export type BatchOperationParams = {
  exponentialBackoffConfigs?: BatchRetryExponentialBackoffConfigs;
};
