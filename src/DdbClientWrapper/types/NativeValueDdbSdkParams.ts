import type { ModifyDdbClientType } from "./ModifyDdbClientType.js";
import type { OmittedDdbSdkParams } from "./OmittedDdbSdkParams.js";
import type { NativeAttributeValue, NativeKeyAttributeValue } from "../../types/index.js";
import type {
  KeysAndAttributes,
  // Constituent types within TransactWriteItem:
  Put,
  Update,
  Delete,
  ConditionCheck,
} from "@aws-sdk/client-dynamodb";
import type { OverrideProperties, SetNonNullable } from "type-fest";

/**
 * This type is a dictionary of fields which are commonly present in SDK command
 * input/output types and need to be overridden to reflect param/return types for
 * the `DdbClientWrapper`, which handles marshalling/unmarshalling of attr values.
 */
export type NativeValueDdbSdkParams = {
  Key: { [keyAttrName: string]: NativeKeyAttributeValue };
  Item: { [attrName: string]: NativeAttributeValue };
  ExpressionAttributeValues?: { [attrName: string]: NativeAttributeValue } | undefined;
  Responses?:
    | { [tableName: string]: Array<{ [attrName: string]: NativeAttributeValue }> }
    | undefined;
  UnprocessedKeys?: { [tableName: string]: NativeValueKeysAndAttributes } | undefined;
  ExclusiveStartKey?: Record<string, NativeAttributeValue> | undefined;
  TransactItems: Array<{
    Put?: ModifyDdbClientType<Put, 2> | undefined;
    Update?: SetNonNullable<ModifyDdbClientType<Update, 2>, "UpdateExpression"> | undefined;
    Delete?: ModifyDdbClientType<Delete, 2> | undefined;
    ConditionCheck?:
      | SetNonNullable<ModifyDdbClientType<ConditionCheck, 2>, "ConditionExpression">
      | undefined;
  }>;
};

/**
 * This type reflect's the SDK's {@link KeysAndAttributes} type with the following modifications:
 * - Omits {@link OmittedDdbSdkParams}
 * - In the `Keys` array, object values are replaced with {@link NativeKeyAttributeValue}
 */
export type NativeValueKeysAndAttributes = OverrideProperties<
  Omit<KeysAndAttributes, OmittedDdbSdkParams>,
  {
    Keys: Array<{ [keyAttrName: string]: NativeKeyAttributeValue }>;
  }
>;

/**
 * This type reflect's the SDK's `WriteRequest` type modified to use unmarshalled values.
 */
export type NativeValueWriteRequest = {
  /** A request to perform a `PutItem` operation. */
  PutRequest?: NativeValuePutRequest | undefined;
  /** A request to perform a `DeleteItem` operation. */
  DeleteRequest?: NativeValueDeleteRequest | undefined;
};

/**
 * This type reflect's the SDK's `PutRequest` type modified to use unmarshalled values.
 */
export type NativeValuePutRequest = {
  Item: {
    [attrName: string]: NativeAttributeValue;
  };
};

/**
 * This type reflect's the SDK's `DeleteRequest` type modified to use unmarshalled values.
 */
export type NativeValueDeleteRequest = {
  Key: {
    [keyAttrName: string]: NativeKeyAttributeValue;
  };
};
