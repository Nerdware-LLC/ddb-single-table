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

/** `DdbClientWrapper` class constructor params. @public */
export type DdbClientWrapperConstructorParams = {
  /**
   * Can be either an existing {@link DynamoDBClient} instance, or
   * {@link DynamoDBClientConfig|arguments} for instantiating a new one.
   */
  ddbClient?: DynamoDBClient | DynamoDBClientConfig;
  /**
   * Marshalling/unmarshalling configs for the DynamoDBDocumentClient instance.
   * @see {@link TranslateConfig}
   */
  marshallingConfigs?: Simplify<TranslateConfig>;
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
 *
 * @remarks The nest-depth counter workaround is currently necessary when recursively mapping
 * object types in order to prevent ts2589 errors ("Type instantiation is excessively deep and
 * possibly infinite"). I've tried refactoring this to be tail-recursive to benefit from
 * [tail-recursion elimination on conditional types][ts-tail-rec], but this does not currently
 * seem to be possible for mapped _object_ types/interfaces - only mapped tuples - since the
 * implementation relies on applying the spread operator to an accumulator of the relevant type,
 * and the spread operator cannot currently be used on object types/interfaces - only tuples.
 *
 * [ts-tail-rec]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#tail-recursion-elimination-on-conditional-types
 * @internal
 */
type FixDocClientValueType<
  T,
  NestDepth extends NestDepthMax10,
> = IterateNestDepthMax10<NestDepth> extends 5
  ? T
  : T extends Record<PropertyKey, unknown>
  ? keyof OmitIndexSignature<T> extends never // <-- If it only contains an index signature, don't map it.
    ? Record<keyof T, FixDocClientValueType<T[keyof T], IterateNestDepthMax10<NestDepth>>>
    : FixDocClientType<T, IterateNestDepthMax10<NestDepth>>
  : T extends Array<infer El>
  ? Array<FixDocClientValueType<El, IterateNestDepthMax10<NestDepth>>>
  : IsAny<T> extends true
  ? unknown
  : T;

/**
 * The nest-depth of DDB client params, up to a maximum of 10.
 * @internal
 */
type NestDepthMax10 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * This internal generic takes a {@link NestDepthMax10|NestDepth} type parameter and returns the
 * next nest-depth value, up to a maximum of `10`.
 * @internal
 */
// prettier-ignore
type IterateNestDepthMax10<NestDepth extends NestDepthMax10 = 0> =
  NestDepth extends 0 ? 1
  : NestDepth extends 1 ? 2
  : NestDepth extends 2 ? 3
  : NestDepth extends 3 ? 4
  : NestDepth extends 4 ? 5
  : NestDepth extends 5 ? 6
  : NestDepth extends 6 ? 7
  : NestDepth extends 7 ? 8
  : NestDepth extends 8 ? 9
  : NestDepth extends 9 ? 10
  : 10;

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
  NestDepth extends NestDepthMax10 = 0,
  T extends Omit<Input, LegacyDdbSdkParameters> = Omit<Input, LegacyDdbSdkParameters>,
> = Simplify<
  // If next NestDepth is 5, return the type as-is to prevent "possibly infinite recursion" error
  IterateNestDepthMax10<NestDepth> extends 5
    ? T
    : {
        // Required properties:
        [Key in RequiredKeysOf<T>]-?: Exclude<FixDocClientValueType<T[Key], NestDepth>, undefined>;
      } & {
        // Optional properties:
        [Key in OptionalKeysOf<T>]?: FixDocClientValueType<T[Key], NestDepth>;
      }
>;

/** Input params for `DdbClientWrapper` methods which implement the `GetItem` command. @public */
export type GetItemInput = FixDocClientType<_GetCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `BatchGetItem` command. @public */
export type BatchGetItemsInput = FixDocClientType<_BatchGetCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `PutItem` command. @public */
export type PutItemInput = FixDocClientType<_PutCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `UpdateItem` command. @public */
export type UpdateItemInput = FixDocClientType<_UpdateCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `DeleteItem` command. @public */
export type DeleteItemInput = FixDocClientType<_DeleteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `BatchWriteItem` command. @public */
export type BatchWriteItemsInput = FixDocClientType<_BatchWriteCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `Query` command. @public */
export type QueryInput = FixDocClientType<_QueryCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `Scan` command. @public */
export type ScanInput = FixDocClientType<_ScanCommandInput>;
/** Input params for `DdbClientWrapper` methods which implement the `DescribeTable` command. @public */
export type DescribeTableInput = FixDocClientType<_DescribeTableInput>;
/** Input params for `DdbClientWrapper` methods which implement the `CreateTable` command. @public */
export type CreateTableInput = FixDocClientType<_CreateTableInput>;
/** Input params for `DdbClientWrapper` methods which implement the `ListTables` command. @public */
export type ListTablesInput = FixDocClientType<_ListTablesInput>;

/** Output from `DdbClientWrapper` methods which implement the `GetItem` command. @public */
export type GetItemOutput = FixDocClientType<_GetCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchGetItem` command. @public */
export type BatchGetItemsOutput = FixDocClientType<_BatchGetCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `PutItem` command. @public */
export type PutItemOutput = FixDocClientType<_PutCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `UpdateItem` command. @public */
export type UpdateItemOutput = FixDocClientType<_UpdateCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `DeleteItem` command. @public */
export type DeleteItemOutput = FixDocClientType<_DeleteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `BatchWriteItem` command. @public */
export type BatchWriteItemsOutput = FixDocClientType<_BatchWriteCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `Query` command. @public */
export type QueryOutput = FixDocClientType<_QueryCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `Scan` command. @public */
export type ScanOutput = FixDocClientType<_ScanCommandOutput>;
/** Output from `DdbClientWrapper` methods which implement the `DescribeTable` command. @public */
export type DescribeTableOutput = FixDocClientType<_DescribeTableOutput>;
/** Output from `DdbClientWrapper` methods which implement the `CreateTable` command. @public */
export type CreateTableOutput = FixDocClientType<_CreateTableOutput>;
/** Output from `DdbClientWrapper` methods which implement the `ListTables` command. @public */
export type ListTablesOutput = FixDocClientType<_ListTablesOutput>;
