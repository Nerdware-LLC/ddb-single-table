import type { OmittedSdkParameters } from "./OmittedSdkParameters.js";
import type { ToUnmarshalledSdkInput } from "./sdkTypeModifiers.js";
import type {
  BaseItem,
  ItemKeys,
  SupportedAttributeValueType,
  OverrideSharedProperties,
  FixPartialUndefined,
} from "../../types/index.js";
import type {
  KeysAndAttributes,
  ItemCollectionMetrics,
  // Constituent types within TransactWriteItem:
  Put,
  Update,
  Delete,
  ConditionCheck,
} from "@aws-sdk/client-dynamodb";

///////////////////////////////////////////////////////////////////////////////
// UNMARSHALLED SDK PARAM TYPES:

/**
 * An _**UNMARSHALLED**_ `ExpressionAttributeValues` object.
 */
export type UnmarshalledExpressionAttributeValues = {
  [eavToken: string]: SupportedAttributeValueType;
};

/**
 * An _**UNMARSHALLED**_ {@link KeysAndAttributes} object (omits {@link OmittedSdkParameters}).
 */
export type UnmarshalledKeysAndAttributes = FixPartialUndefined<
  OverrideSharedProperties<Omit<KeysAndAttributes, OmittedSdkParameters>, { Keys: Array<ItemKeys> }>
>;

/**
 * An _**UNMARSHALLED**_ {@link WriteRequest} object for `BatchWriteItem` operations.
 */
export type UnmarshalledBatchWriteRequest = {
  PutRequest?: { Item: BaseItem };
  DeleteRequest?: { Key: ItemKeys };
};

/**
 * An _**UNMARSHALLED**_ {@link TransactWriteItem} object for `TransactWriteItems` operations.
 */
export type UnmarshalledTransactWriteItem = {
  Put?: ToUnmarshalledSdkInput<Put>;
  Update?: ToUnmarshalledSdkInput<Update>;
  Delete?: ToUnmarshalledSdkInput<Delete>;
  ConditionCheck?: ToUnmarshalledSdkInput<ConditionCheck>;
};

///////////////////////////////////////////////////////////////////////////////
// UNMARSHALLED SDK RESPONSE-FIELD TYPES:

/**
 * An _**UNMARSHALLED**_ {@link ItemCollectionMetrics} object.
 */
export type UnmarshalledItemCollectionMetrics = FixPartialUndefined<
  OverrideSharedProperties<ItemCollectionMetrics, { ItemCollectionKey?: ItemKeys }>
>;
