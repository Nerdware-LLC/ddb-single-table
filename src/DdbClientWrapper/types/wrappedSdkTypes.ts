import type { MarshallingConfigsParam } from "./MarshallingConfigsParam.js";
import type { ModifyDdbClientType } from "./ModifyDdbClientType.js";
import type { BatchOperationParams } from "./batchOperationTypes.js";
import type {
  // MODEL-METHOD IO TYPES
  GetItemCommandInput as SDKGetItemInput,
  GetItemCommandOutput as SDKGetItemOutput,
  BatchGetItemCommandInput as SDKBatchGetItemInput,
  BatchGetItemCommandOutput as SDKBatchGetItemOutput,
  PutItemCommandInput as SDKPutItemInput,
  PutItemCommandOutput as SDKPutItemOutput,
  UpdateItemCommandInput as SDKUpdateItemInput,
  UpdateItemCommandOutput as SDKUpdateItemOutput,
  DeleteItemCommandInput as SDKDeleteItemInput,
  DeleteItemCommandOutput as SDKDeleteItemOutput,
  BatchWriteItemCommandInput as SDKBatchWriteItemInput,
  BatchWriteItemCommandOutput as SDKBatchWriteItemOutput,
  QueryCommandInput as SDKQueryInput,
  QueryCommandOutput as SDKQueryOutput,
  ScanCommandInput as SDKScanInput,
  ScanCommandOutput as SDKScanOutput,
  TransactWriteItemsCommandInput as SDKTransactWriteItemsInput,
  TransactWriteItemsCommandOutput as SDKTransactWriteItemsOutput,
  // TABLE-METHOD IO TYPES
  CreateTableInput as SDKCreateTableInput,
  CreateTableOutput as SDKCreateTableOutput,
  DescribeTableInput as SDKDescribeTableInput,
  DescribeTableOutput as SDKDescribeTableOutput,
  ListTablesInput as SDKListTablesInput,
  ListTablesOutput as SDKListTablesOutput,
} from "@aws-sdk/client-dynamodb";
import type { Simplify } from "type-fest";

/** Input params for `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemInput = ModifyDdbClientType<SDKGetItemInput & MarshallingConfigsParam>;
/** Output from `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemOutput = ModifyDdbClientType<SDKGetItemOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsInput = ModifyDdbClientType<
  SDKBatchGetItemInput & MarshallingConfigsParam & BatchOperationParams
>;
/** Output from `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsOutput = ModifyDdbClientType<SDKBatchGetItemOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemInput = ModifyDdbClientType<SDKPutItemInput & MarshallingConfigsParam>;
/** Output from `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemOutput = ModifyDdbClientType<SDKPutItemOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemInput = ModifyDdbClientType<SDKUpdateItemInput & MarshallingConfigsParam>;
/** Output from `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemOutput = ModifyDdbClientType<SDKUpdateItemOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemInput = ModifyDdbClientType<SDKDeleteItemInput & MarshallingConfigsParam>;
/** Output from `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemOutput = ModifyDdbClientType<SDKDeleteItemOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsInput = ModifyDdbClientType<
  SDKBatchWriteItemInput & MarshallingConfigsParam & BatchOperationParams
>;
/** Output from `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsOutput = ModifyDdbClientType<SDKBatchWriteItemOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryInput = ModifyDdbClientType<SDKQueryInput & MarshallingConfigsParam>;
/** Output from `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryOutput = ModifyDdbClientType<SDKQueryOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanInput = ModifyDdbClientType<SDKScanInput & MarshallingConfigsParam>;
/** Output from `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanOutput = ModifyDdbClientType<SDKScanOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type TransactWriteItemsInput = ModifyDdbClientType<
  SDKTransactWriteItemsInput & MarshallingConfigsParam
>;
/** Output from `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type TransactWriteItemsOutput = ModifyDdbClientType<SDKTransactWriteItemsOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableInput = Simplify<ModifyDdbClientType<SDKDescribeTableInput>>;
/** Output from `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableOutput = ModifyDdbClientType<SDKDescribeTableOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableInput = ModifyDdbClientType<SDKCreateTableInput>;
/** Output from `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableOutput = ModifyDdbClientType<SDKCreateTableOutput>;

/** Input params for `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesInput = ModifyDdbClientType<SDKListTablesInput>;
/** Output from `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesOutput = ModifyDdbClientType<SDKListTablesOutput>;
