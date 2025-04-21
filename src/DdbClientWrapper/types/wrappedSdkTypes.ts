import type { NestDepthMax32, IterateNestDepthMax32 } from "../../types/index.js";
import type {
  CreateTableInput as SDK_CreateTableInput,
  CreateTableOutput as SDK_CreateTableOutput,
  DescribeTableInput as SDK_DescribeTableInput,
  DescribeTableOutput as SDK_DescribeTableOutput,
  ListTablesInput as SDK_ListTablesInput,
  ListTablesOutput as SDK_ListTablesOutput,
} from "@aws-sdk/client-dynamodb";
import type {
  GetCommandInput as SDK_GetCommandInput,
  GetCommandOutput as SDK_GetCommandOutput,
  BatchGetCommandInput as SDK_BatchGetCommandInput,
  BatchGetCommandOutput as SDK_BatchGetCommandOutput,
  PutCommandInput as SDK_PutCommandInput,
  PutCommandOutput as SDK_PutCommandOutput,
  BatchWriteCommandInput as SDK_BatchWriteCommandInput,
  BatchWriteCommandOutput as SDK_BatchWriteCommandOutput,
  UpdateCommandInput as SDK_UpdateCommandInput,
  UpdateCommandOutput as SDK_UpdateCommandOutput,
  DeleteCommandInput as SDK_DeleteCommandInput,
  DeleteCommandOutput as SDK_DeleteCommandOutput,
  QueryCommandInput as SDK_QueryCommandInput,
  QueryCommandOutput as SDK_QueryCommandOutput,
  ScanCommandInput as SDK_ScanCommandInput,
  ScanCommandOutput as SDK_ScanCommandOutput,
  TransactWriteCommandInput as SDK_TransactWriteCommandInput,
  TransactWriteCommandOutput as SDK_TransactWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type { Simplify, OmitIndexSignature, IsAny } from "type-fest";

/**
 * A union of deprecated/legacy SDK command parameter names. To prevent their use, this
 * package omits them from all ddb client parameter typings — those used internally, as
 * well as the typings exposed to end users.
 */
type LegacyDdbSdkParameters =
  | "AttributesToGet" //      Legacy param: instead use ProjectionExpression
  | "AttributeUpdates" //     Legacy param: instead use UpdateExpression
  | "ConditionalOperator" //  Legacy param: instead use ConditionExpression (for Query/Scan, instead use FilterExpression)
  | "Expected" //             Legacy param: instead use ConditionExpression
  | "KeyConditions" //        Legacy param: instead use KeyConditionExpression
  | "QueryFilter" //          Legacy param: instead use FilterExpression
  | "ScanFilter"; //          Legacy param: instead use FilterExpression

/**
 * This internal generic util-type is used by {@link FixDocClientType} to handle mapped values.
 */
type FixDocClientValueType<T, NestDepth extends NestDepthMax32> =
  IterateNestDepthMax32<NestDepth> extends 32
    ? T
    : T extends Record<PropertyKey, unknown>
      ? keyof OmitIndexSignature<T> extends never // <-- If it only contains an index signature, don't map it.
        ? Record<keyof T, FixDocClientValueType<T[keyof T], IterateNestDepthMax32<NestDepth>>>
        : FixDocClientType<T, IterateNestDepthMax32<NestDepth>>
      : T extends Array<infer El>
        ? Array<FixDocClientValueType<El, IterateNestDepthMax32<NestDepth>>>
        : IsAny<T> extends true
          ? unknown
          : T;

/**
 * This internal generic util type takes a DynamoDBDocumentClient command input/output type `<T>`
 * and applies the following modifications to it:
 *
 * - Removes all {@link LegacyDdbSdkParameters | deprecated legacy parameters }
 * - Removes `undefined` from required properties (e.g., `string | undefined` becomes `string`)
 * - Replaces explicit `any` types with `unknown`
 * - Recursively applies type-fest's `Simplify` to the result for easier-to-read intellisense
 *
 * Note that the `NestDepth` type param is necessary to prevent a ts2589 error ("Type instantiation
 * is excessively deep and possibly infinite"), which occurs when recursively mapping object types.
 */
type FixDocClientType<
  Input extends object,
  NestDepth extends NestDepthMax32 = 0,
  T extends Omit<Input, LegacyDdbSdkParameters> = Omit<Input, LegacyDdbSdkParameters>,
> = Simplify<
  IterateNestDepthMax32<NestDepth> extends 32
    ? T
    : { [Key in keyof T]: FixDocClientValueType<T[Key], NestDepth> }
>;

/** Input params for `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemInput = FixDocClientType<SDK_GetCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsInput = FixDocClientType<SDK_BatchGetCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemInput = FixDocClientType<SDK_PutCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemInput = FixDocClientType<SDK_UpdateCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemInput = FixDocClientType<SDK_DeleteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsInput = FixDocClientType<SDK_BatchWriteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryInput = FixDocClientType<SDK_QueryCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanInput = FixDocClientType<SDK_ScanCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type TransactWriteItemsInput = FixDocClientType<SDK_TransactWriteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableInput = FixDocClientType<SDK_DescribeTableInput>;
/** Input params for `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableInput = FixDocClientType<SDK_CreateTableInput>;
/** Input params for `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesInput = FixDocClientType<SDK_ListTablesInput>;

/** Output from `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemOutput = FixDocClientType<SDK_GetCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsOutput = FixDocClientType<SDK_BatchGetCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemOutput = FixDocClientType<SDK_PutCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemOutput = FixDocClientType<SDK_UpdateCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemOutput = FixDocClientType<SDK_DeleteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsOutput = FixDocClientType<SDK_BatchWriteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryOutput = FixDocClientType<SDK_QueryCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanOutput = FixDocClientType<SDK_ScanCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `TransactWriteItems` command. */
export type TransactWriteItemsOutput = FixDocClientType<SDK_TransactWriteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableOutput = FixDocClientType<SDK_DescribeTableOutput>;
/** Output from `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableOutput = FixDocClientType<SDK_CreateTableOutput>;
/** Output from `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesOutput = FixDocClientType<SDK_ListTablesOutput>;
