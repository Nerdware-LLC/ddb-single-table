import type {
  NativeValueDdbSdkParams,
  NativeValueKeysAndAttributes,
  NativeValueWriteRequest,
} from "./NativeValueDdbSdkParams.js";
import type { OmittedDdbSdkParams } from "./OmittedDdbSdkParams.js";
import type { AttributeValue, KeysAndAttributes, WriteRequest } from "@aws-sdk/client-dynamodb";
import type { Simplify, OmitIndexSignature, IsAny } from "type-fest";

/**
 * This internal generic util type takes a DynamoDBClient command input/output
 * type `<T>` and applies the following modifications to it:
 *
 * - Replaces _marshalled_ types with _unmarshalled_/_native-value_ types
 * - Removes all {@link OmittedDdbSdkParams|deprecated legacy parameters}
 * - Replaces explicit `any` with `unknown`
 * - Applies type-fest's `Simplify` to the result for easier-to-read intellisense
 *
 * Note that the `NestDepth` type param is necessary to prevent a ts2589 error
 * ("Type instantiation is excessively deep and possibly infinite"), which occurs
 * when recursively mapping object types.
 */
export type ModifyDdbClientType<
  Input extends object,
  NestDepth extends NestDepthMax10 = 0,
  T extends Omit<Input, OmittedDdbSdkParams> = Omit<Input, OmittedDdbSdkParams>,
> = Simplify<
  IterateNestDepthMax10<NestDepth> extends 10
    ? T
    : {
        // Key-based modifications occur here instead of ModifyDdbClientValueType
        [Key in keyof T]: Key extends keyof NativeValueDdbSdkParams
          ? NativeValueDdbSdkParams[Key]
          : Key extends "RequestItems"
            ? {
                [tableName: string]: Record<string, KeysAndAttributes> extends T[Key]
                  ? NativeValueKeysAndAttributes // BatchGetItem
                  : Record<string, WriteRequest[]> extends T[Key]
                    ? Array<NativeValueWriteRequest> // BatchWriteItem
                    : never;
              }
            : ModifyDdbClientValueType<T[Key], NestDepth>;
      }
>;

/**
 * Internal generic used by {@link ModifyDdbClientType} to handle value-based type modifications.
 */
export type ModifyDdbClientValueType<T, NestDepth extends NestDepthMax10> = T extends AttributeValue
  ? unknown
  : T extends Record<PropertyKey, unknown>
    ? keyof OmitIndexSignature<T> extends never // <-- If it only contains an index signature, don't map it.
      ? Record<keyof T, ModifyDdbClientValueType<T[keyof T], IterateNestDepthMax10<NestDepth>>>
      : ModifyDdbClientType<T, IterateNestDepthMax10<NestDepth>>
    : T extends Array<infer El>
      ? Array<ModifyDdbClientValueType<El, IterateNestDepthMax10<NestDepth>>>
      : IsAny<T> extends true
        ? unknown
        : T;

/**
 * This generic is used to fix "type instantiation is excessively deep and possibly infinite" errors.
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

type NestDepthMax10 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
