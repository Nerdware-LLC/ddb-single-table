import type { BatchConfigsParameter } from "./BatchConfigs.js";
import type { MarshallingConfigsParameter } from "./MarshallingConfigs.js";
import type { OmittedSdkParameters } from "./OmittedSdkParameters.js";
import type { SdkParameterThatRequiresMarshalling } from "./sdkTypeModifiers.js";
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
import type { FixPartialUndefined } from "../../types/index.js";
import type {
  CreateTableCommandInput as SDKCreateTableCmdInput,
  CreateTableCommandOutput as SDKCreateTableCmdOutput,
  DescribeTableCommandInput as SDKDescribeTableCmdInput,
  DescribeTableCommandOutput as SDKDescribeTableCmdOutput,
  ListTablesCommandInput as SDKListTablesCmdInput,
  ListTablesCommandOutput as SDKListTablesCmdOutput,
} from "@aws-sdk/client-dynamodb";

/** Input params for `DdbClientWrapper` methods which implement the `GetItem` command. */
export type ClientWrapperGetItemInput =
  ModifySdkInputForClientWrapper<UnmarshalledGetItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `GetItem` command. */
export type ClientWrapperGetItemOutput = UnmarshalledGetItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type ClientWrapperBatchGetItemInput =
  ModifySdkInputForClientWrapper<UnmarshalledBatchGetItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type ClientWrapperBatchGetItemOutput = UnmarshalledBatchGetItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `PutItem` command. */
export type ClientWrapperPutItemInput =
  ModifySdkInputForClientWrapper<UnmarshalledPutItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `PutItem` command. */
export type ClientWrapperPutItemOutput = UnmarshalledPutItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type ClientWrapperUpdateItemInput =
  ModifySdkInputForClientWrapper<UnmarshalledUpdateItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type ClientWrapperUpdateItemOutput = UnmarshalledUpdateItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type ClientWrapperDeleteItemInput =
  ModifySdkInputForClientWrapper<UnmarshalledDeleteItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type ClientWrapperDeleteItemOutput = UnmarshalledDeleteItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type ClientWrapperBatchWriteItemInput =
  ModifySdkInputForClientWrapper<UnmarshalledBatchWriteItemCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type ClientWrapperBatchWriteItemOutput = UnmarshalledBatchWriteItemCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `Query` command. */
export type ClientWrapperQueryInput = ModifySdkInputForClientWrapper<UnmarshalledQueryCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `Query` command. */
export type ClientWrapperQueryOutput = UnmarshalledQueryCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `Scan` command. */
export type ClientWrapperScanInput = ModifySdkInputForClientWrapper<UnmarshalledScanCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `Scan` command. */
export type ClientWrapperScanOutput = UnmarshalledScanCommandOutput;

/** Input params for `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type ClientWrapperTransactWriteItemsInput =
  ModifySdkInputForClientWrapper<UnmarshalledTransactWriteItemsCommandInput>;
/** Output from `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type ClientWrapperTransactWriteItemsOutput = UnmarshalledTransactWriteItemsCommandOutput;

///////////////////////////////////////////////////////////////////////////////
// TABLE CONTROL-PLANE METHODS  (no fields to marshall/unmarshall)

/** Input params for `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type ClientWrapperDescribeTableInput =
  ModifySdkInputForClientWrapper<SDKDescribeTableCmdInput>;
/** Output from `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type ClientWrapperDescribeTableOutput = SDKDescribeTableCmdOutput;

/** Input params for `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type ClientWrapperCreateTableInput = ModifySdkInputForClientWrapper<SDKCreateTableCmdInput>;
/** Output from `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type ClientWrapperCreateTableOutput = SDKCreateTableCmdOutput;

/** Input params for `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ClientWrapperListTablesInput = ModifySdkInputForClientWrapper<SDKListTablesCmdInput>;
/** Output from `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ClientWrapperListTablesOutput = SDKListTablesCmdOutput;

///////////////////////////////////////////////////////////////////////////////

/**
 * This generic takes a DynamoDBClient command-**input** type and modifies it as follows:
 * - Removes all {@link OmittedSdkParameters|deprecated legacy parameters}
 * - Adds the {@link MarshallingConfigsParameter} if the input has any marshalled fields
 * - Adds the {@link BatchConfigsParameter} if the input has a `RequestItems` field
 */
// prettier-ignore
type ModifySdkInputForClientWrapper<UnmarshalledSdkInput extends object> = FixPartialUndefined<
  Omit<UnmarshalledSdkInput, OmittedSdkParameters>
    & // Add the `MarshallingConfigsParameter` if the input has any marshalled fields:
    (Extract<keyof UnmarshalledSdkInput, SdkParameterThatRequiresMarshalling> extends never
      ? unknown
      : MarshallingConfigsParameter)
    & // Add the `BatchConfigsParameter` if the input has a `RequestItems` field:
    ("RequestItems" extends keyof UnmarshalledSdkInput ? BatchConfigsParameter : unknown)
>;
