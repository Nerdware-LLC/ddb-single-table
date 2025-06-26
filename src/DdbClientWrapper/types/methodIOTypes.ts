import type { BatchConfigsParam } from "./BatchConfigs.js";
import type { MarshallingConfigsParam } from "./MarshallingConfigs.js";
import type { OmittedSdkParams } from "./OmittedSdkParams.js";
import type { SdkParamThatRequiresMarshalling } from "./sdkTypeModifiers.js";
import type {
  UnmarshalledGetItemCommandInput,
  UnmarshalledGetItemCommandOutput,
  UnmarshalledBatchGetItemCommandInput,
  UnmarshalledBatchGetItemCommandOutput,
  UnmarshalledPutItemCommandInput,
  UnmarshalledPutItemCommandOutput,
  UnmarshalledUpdateItemCommandInput,
  UnmarshalledUpdateItemCommandOutput,
  UnmarshalledDeleteItemCommandInput,
  UnmarshalledDeleteItemCommandOutput,
  UnmarshalledBatchWriteItemCommandInput,
  UnmarshalledBatchWriteItemCommandOutput,
  UnmarshalledQueryCommandInput,
  UnmarshalledQueryCommandOutput,
  UnmarshalledScanCommandInput,
  UnmarshalledScanCommandOutput,
  UnmarshalledTransactWriteItemsCommandInput,
  UnmarshalledTransactWriteItemsCommandOutput,
} from "./unmarshalledSdkCommandTypes.js";
import type {
  CreateTableCommandInput as SDKCreateTableCmdInput,
  CreateTableCommandOutput as SDKCreateTableCmdOutput,
  DescribeTableCommandInput as SDKDescribeTableCmdInput,
  DescribeTableCommandOutput as SDKDescribeTableCmdOutput,
  ListTablesCommandInput as SDKListTablesCmdInput,
  ListTablesCommandOutput as SDKListTablesCmdOutput,
} from "@aws-sdk/client-dynamodb";
import type { Simplify } from "type-fest";

/** Input params for `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemInput = ModifySdkInputType<UnmarshalledGetItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemOutput = UnmarshalledGetItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsInput = ModifySdkInputType<UnmarshalledBatchGetItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsOutput = UnmarshalledBatchGetItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemInput = ModifySdkInputType<UnmarshalledPutItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemOutput = UnmarshalledPutItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemInput = ModifySdkInputType<UnmarshalledUpdateItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemOutput = UnmarshalledUpdateItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemInput = ModifySdkInputType<UnmarshalledDeleteItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemOutput = UnmarshalledDeleteItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsInput = ModifySdkInputType<UnmarshalledBatchWriteItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsOutput = UnmarshalledBatchWriteItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryInput = ModifySdkInputType<UnmarshalledQueryCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryOutput = UnmarshalledQueryCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanInput = ModifySdkInputType<UnmarshalledScanCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanOutput = UnmarshalledScanCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type TransactWriteItemsInput =
  ModifySdkInputType<UnmarshalledTransactWriteItemsCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type TransactWriteItemsOutput = UnmarshalledTransactWriteItemsCommandOutput;

///////////////////////////////////////////////////////////////////////////////
// TABLE CONTROL-PLANE METHODS  (no fields to marshall/unmarshall)

/** Input params for `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableInput = ModifySdkInputType<SDKDescribeTableCmdInput>;
/** Output from `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableOutput = SDKDescribeTableCmdOutput;

/** Input params for `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableInput = ModifySdkInputType<SDKCreateTableCmdInput>;
/** Output from `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableOutput = SDKCreateTableCmdOutput;

/** Input params for `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesInput = ModifySdkInputType<SDKListTablesCmdInput>;
/** Output from `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesOutput = SDKListTablesCmdOutput;

///////////////////////////////////////////////////////////////////////////////

/**
 * This generic takes a DynamoDBClient command-**input** type and modifies it as follows:
 * - Removes all {@link OmittedSdkParams|deprecated legacy parameters}
 * - Adds the {@link MarshallingConfigsParam} if the input has any marshalled fields
 * - Adds the {@link BatchConfigsParam} if the input has a `RequestItems` field
 */
// prettier-ignore
type ModifySdkInputType<UnmarshalledSdkInput extends object> = Simplify<
  Omit<UnmarshalledSdkInput, OmittedSdkParams>
    & // Add the `MarshallingConfigsParam` if the input has any marshalled fields:
    (Extract<keyof UnmarshalledSdkInput, SdkParamThatRequiresMarshalling> extends never
      ? unknown
      : MarshallingConfigsParam)
    & // Add the `BatchConfigsParam` if the input has a `RequestItems` field:
    ("RequestItems" extends keyof UnmarshalledSdkInput ? BatchConfigsParam : unknown)
>;
