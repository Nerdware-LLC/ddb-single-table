import type {
  DynamoDBClient,
  DynamoDBClientConfig,
  CreateTableInput as _CreateTableInput,
  CreateTableOutput as _CreateTableOutput,
  DescribeTableInput as _DescribeTableInput,
  DescribeTableOutput as _DescribeTableOutput,
  ListTablesInput as _ListTablesInput,
  ListTablesOutput as _ListTablesOutput,
} from "@aws-sdk/client-dynamodb";
import type {
  TranslateConfig,
  GetCommandInput as _GetCommandInput,
  GetCommandOutput as _GetCommandOutput,
  BatchGetCommandInput as _BatchGetCommandInput,
  BatchGetCommandOutput as _BatchGetCommandOutput,
  PutCommandInput as _PutCommandInput,
  PutCommandOutput as _PutCommandOutput,
  BatchWriteCommandInput as _BatchWriteCommandInput,
  BatchWriteCommandOutput as _BatchWriteCommandOutput,
  UpdateCommandInput as _UpdateCommandInput,
  UpdateCommandOutput as _UpdateCommandOutput,
  DeleteCommandInput as _DeleteCommandInput,
  DeleteCommandOutput as _DeleteCommandOutput,
  QueryCommandInput as _QueryCommandInput,
  QueryCommandOutput as _QueryCommandOutput,
  ScanCommandInput as _ScanCommandInput,
  ScanCommandOutput as _ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type {
  Simplify,
  OmitIndexSignature,
  RequiredKeysOf,
  OptionalKeysOf,
  IsAny,
} from "type-fest";
import type { NestDepthMax5, IterateNestDepth } from "../types/utilTypes";

/**
 * `DdbClientWrapper` class constructor params.
 */
export type DdbClientWrapperConstructorParams = {
  ddbClient?: DynamoDBClient;
  ddbClientConfigs?: DynamoDBClientConfig;
  marshallingConfigs?: TranslateConfig;
};

/**
 * A union of deprecated/legacy SDK command parameter names. To prevent their use, this
 * package omits them from all ddb client parameter typings - those used internally, as
 * well as the typings exposed to end users.
 * @internal
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
 * @internal
 */
type FixDocClientValueType<
  T,
  NestDepth extends NestDepthMax5,
> = IterateNestDepth<NestDepth> extends 5
  ? T
  : T extends Record<PropertyKey, unknown>
  ? keyof OmitIndexSignature<T> extends never // <-- If it only contains an index signature, don't map it.
    ? Record<keyof T, FixDocClientValueType<T[keyof T], IterateNestDepth<NestDepth>>>
    : FixDocClientType<T, IterateNestDepth<NestDepth>>
  : T extends Array<infer El>
  ? Array<FixDocClientValueType<El, IterateNestDepth<NestDepth>>>
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
 * @internal
 */
type FixDocClientType<
  Input extends object,
  NestDepth extends NestDepthMax5 = 0,
  T_WithoutLegacyParams extends Omit<T, LegacyDdbSdkParameters> = Omit<T, LegacyDdbSdkParameters>,
> = Simplify<
  // If next NestDepth is 5, return the type as-is to prevent "possibly infinite recursion" error
  IterateNestDepth<NestDepth> extends 5
    ? T
    : {
        // Required properties:
        [Key in RequiredKeysOf<T_WithoutLegacyParams>]-?: Exclude<
          FixDocClientValueType<T[Key], NestDepth>,
          undefined
        >;
      } & {
        // Optional properties:
        [Key in OptionalKeysOf<T_WithoutLegacyParams>]?: FixDocClientValueType<T[Key], NestDepth>;
      }
>;

/** Input params for `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemInput = FixDocClientType<_GetCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsInput = FixDocClientType<_BatchGetCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemInput = FixDocClientType<_PutCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemInput = FixDocClientType<_UpdateCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemInput = FixDocClientType<_DeleteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsInput = FixDocClientType<_BatchWriteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryInput = FixDocClientType<_QueryCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanInput = FixDocClientType<_ScanCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableInput = FixDocClientType<_DescribeTableInput>;
/** Input params for `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableInput = FixDocClientType<_CreateTableInput>;
/** Input params for `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesInput = FixDocClientType<_ListTablesInput>;

/** Output from `DdbClientWrapper` methods which implement the `GetItem` command. */
export type GetItemOutput = FixDocClientType<_GetCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchGetItem` command. */
export type BatchGetItemsOutput = FixDocClientType<_BatchGetCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `PutItem` command. */
export type PutItemOutput = FixDocClientType<_PutCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `UpdateItem` command. */
export type UpdateItemOutput = FixDocClientType<_UpdateCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `DeleteItem` command. */
export type DeleteItemOutput = FixDocClientType<_DeleteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchWriteItem` command. */
export type BatchWriteItemsOutput = FixDocClientType<_BatchWriteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `Query` command. */
export type QueryOutput = FixDocClientType<_QueryCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `Scan` command. */
export type ScanOutput = FixDocClientType<_ScanCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `DescribeTable` command. */
export type DescribeTableOutput = FixDocClientType<_DescribeTableOutput>;
/** Output from `DdbClientWrapper` methods which implement the `CreateTable` command. */
export type CreateTableOutput = FixDocClientType<_CreateTableOutput>;
/** Output from `DdbClientWrapper` methods which implement the `ListTables` command. */
export type ListTablesOutput = FixDocClientType<_ListTablesOutput>;
