import type { ToUnmarshalledSdkInput, ToUnmarshalledSdkOutput } from "./sdkTypeModifiers.js";
import type {
  GetItemCommandInput as SDKGetItemCmdInput,
  GetItemCommandOutput as SDKGetItemCmdOutput,
  BatchGetItemCommandInput as SDKBatchGetItemCmdInput,
  BatchGetItemCommandOutput as SDKBatchGetItemCmdOutput,
  PutItemCommandInput as SDKPutItemCmdInput,
  PutItemCommandOutput as SDKPutItemCmdOutput,
  UpdateItemCommandInput as SDKUpdateItemCmdInput,
  UpdateItemCommandOutput as SDKUpdateItemCmdOutput,
  DeleteItemCommandInput as SDKDeleteItemCmdInput,
  DeleteItemCommandOutput as SDKDeleteItemCmdOutput,
  BatchWriteItemCommandInput as SDKBatchWriteItemCmdInput,
  BatchWriteItemCommandOutput as SDKBatchWriteItemCmdOutput,
  QueryCommandInput as SDKQueryCmdInput,
  QueryCommandOutput as SDKQueryCmdOutput,
  ScanCommandInput as SDKScanCmdInput,
  ScanCommandOutput as SDKScanCmdOutput,
  TransactWriteItemsCommandInput as SDKTransactWriteItemsCmdInput,
  TransactWriteItemsCommandOutput as SDKTransactWriteItemsCmdOutput,
} from "@aws-sdk/client-dynamodb";

/**
 * Union of supported **unmarshalled** SDK Command-input types.
 */
export type SomeUnmarshalledCommandInput =
  | UnmarshalledGetItemCommandInput
  | UnmarshalledBatchGetItemCommandInput
  | UnmarshalledPutItemCommandInput
  | UnmarshalledUpdateItemCommandInput
  | UnmarshalledDeleteItemCommandInput
  | UnmarshalledBatchWriteItemCommandInput
  | UnmarshalledQueryCommandInput
  | UnmarshalledScanCommandInput
  | UnmarshalledTransactWriteItemsCommandInput;

/**
 * Union of supported SDK Command-output types (**marshalled**).
 */
export type SomeMarshalledCommandOutput =
  | SDKGetItemCmdOutput
  | SDKBatchGetItemCmdOutput
  | SDKPutItemCmdOutput
  | SDKUpdateItemCmdOutput
  | SDKDeleteItemCmdOutput
  | SDKBatchWriteItemCmdOutput
  | SDKQueryCmdOutput
  | SDKScanCmdOutput
  | SDKTransactWriteItemsCmdOutput;

/** Unmarshalled params for creating a new `GetItemCommand`. */
export type UnmarshalledGetItemCommandInput = ToUnmarshalledSdkInput<SDKGetItemCmdInput>;
/** Unmarshalled output returned from a parsed `GetItemCommand` response. */
export type UnmarshalledGetItemCommandOutput = ToUnmarshalledSdkOutput<SDKGetItemCmdOutput>;

/** Unmarshalled params for creating a new `BatchGetItemCommand`. */
export type UnmarshalledBatchGetItemCommandInput = ToUnmarshalledSdkInput<SDKBatchGetItemCmdInput>;
/** Unmarshalled output returned from a parsed `BatchGetItemCommand` response. */
export type UnmarshalledBatchGetItemCommandOutput =
  ToUnmarshalledSdkOutput<SDKBatchGetItemCmdOutput>;

/** Unmarshalled params for creating a new `PutItemCommand`. */
export type UnmarshalledPutItemCommandInput = ToUnmarshalledSdkInput<SDKPutItemCmdInput>;
/** Unmarshalled output returned from a parsed `PutItemCommand` response. */
export type UnmarshalledPutItemCommandOutput = ToUnmarshalledSdkOutput<SDKPutItemCmdOutput>;

/** Unmarshalled params for creating a new `UpdateItemCommand`. */
export type UnmarshalledUpdateItemCommandInput = ToUnmarshalledSdkInput<SDKUpdateItemCmdInput>;
/** Unmarshalled output returned from a parsed `UpdateItemCommand` response. */
export type UnmarshalledUpdateItemCommandOutput = ToUnmarshalledSdkOutput<SDKUpdateItemCmdOutput>;

/** Unmarshalled params for creating a new `DeleteItemCommand`. */
export type UnmarshalledDeleteItemCommandInput = ToUnmarshalledSdkInput<SDKDeleteItemCmdInput>;
/** Unmarshalled output returned from a parsed `DeleteItemCommand` response. */
export type UnmarshalledDeleteItemCommandOutput = ToUnmarshalledSdkOutput<SDKDeleteItemCmdOutput>;

/** Unmarshalled params for creating a new `BatchWriteItemCommand`. */
export type UnmarshalledBatchWriteItemCommandInput =
  ToUnmarshalledSdkInput<SDKBatchWriteItemCmdInput>;
/** Unmarshalled output returned from a parsed `BatchWriteItemCommand` response. */
export type UnmarshalledBatchWriteItemCommandOutput =
  ToUnmarshalledSdkOutput<SDKBatchWriteItemCmdOutput>;

/** Unmarshalled params for creating a new `QueryCommand`. */
export type UnmarshalledQueryCommandInput = ToUnmarshalledSdkInput<SDKQueryCmdInput>;
/** Unmarshalled output returned from a parsed `QueryCommand` response. */
export type UnmarshalledQueryCommandOutput = ToUnmarshalledSdkOutput<SDKQueryCmdOutput>;

/** Unmarshalled params for creating a new `ScanCommand`. */
export type UnmarshalledScanCommandInput = ToUnmarshalledSdkInput<SDKScanCmdInput>;
/** Unmarshalled output returned from a parsed `ScanCommand` response. */
export type UnmarshalledScanCommandOutput = ToUnmarshalledSdkOutput<SDKScanCmdOutput>;

/** Unmarshalled params for creating a new `TransactWriteItemsCommand`. */
export type UnmarshalledTransactWriteItemsCommandInput =
  ToUnmarshalledSdkInput<SDKTransactWriteItemsCmdInput>;
/** Unmarshalled output returned from a parsed `TransactWriteItemsCommand` response. */
export type UnmarshalledTransactWriteItemsCommandOutput =
  ToUnmarshalledSdkOutput<SDKTransactWriteItemsCmdOutput>;
