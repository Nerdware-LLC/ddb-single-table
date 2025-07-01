import type { OmittedSdkParameters } from "./OmittedSdkParameters.js";
import type {
  UnmarshalledExpressionAttributeValues,
  UnmarshalledKeysAndAttributes,
  UnmarshalledBatchWriteRequest,
  UnmarshalledTransactWriteItem,
  UnmarshalledItemCollectionMetrics,
} from "./unmarshalledSdkFieldTypes.js";
import type {
  BaseItem,
  ItemKeys,
  OverrideSharedProperties,
  FixPartialUndefined,
} from "../../types/index.js";
import type {
  AttributeValue,
  KeysAndAttributes,
  WriteRequest,
  ItemCollectionMetrics,
  TransactWriteItem,
  __MetadataBearer as MetadataBearer,
} from "@aws-sdk/client-dynamodb";
import type { Simplify } from "type-fest";

///////////////////////////////////////////////////////////////////////////////////////////////////
// DICTIONARIES THAT MAP SDK FIELDS TO THEIR MARSHALLED & UNMARSHALLED TYPES

/**
 * This type is used to organize the mapping between MARSHALLED and UNMARSHALLED
 * types for two kinds of SDK fields:
 *
 * 1. SDK params that must be MARSHALLED before they can be used to create an SDK Command instance
 * 2. SDK response fields that must be UNMARSHALLED after the SDK Command has been executed
 */
type MarshalledSdkFieldMeta<MarshalledTypeFromSDK = unknown, UnmarshalledType = unknown> = {
  MARSHALLED: MarshalledTypeFromSDK; // internal marshalled type from SDK
  UNMARSHALLED: UnmarshalledType; //    external unmarshalled type
};

/**
 * ### SDK PARAMS THAT REQUIRE MARSHALLING
 *
 * This type is a dictionary of SDK params that must be **MARSHALLED** before they can be used to
 * create an SDK Command instance. Each param is mapped to a {@link MarshalledSdkFieldMeta} type
 * that defines its **MARSHALLED** and **UNMARSHALLED** types.
 */
type SdkParamsThatRequireMarshalling<SdkInput extends object> = {
  Key: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, // internal marshalled type from SDK
    ItemKeys //                        external unmarshalled type
  >;
  Item: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, // internal marshalled type from SDK
    BaseItem //                        external unmarshalled type
  >;
  ExpressionAttributeValues?: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, //       internal marshalled type from SDK
    UnmarshalledExpressionAttributeValues // external unmarshalled type
  >;
  ExclusiveStartKey?: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, // internal marshalled type from SDK
    ItemKeys //                        external unmarshalled type
  >;
  TransactItems: MarshalledSdkFieldMeta<
    Array<TransactWriteItem>, //            internal marshalled type from SDK
    Array<UnmarshalledTransactWriteItem> // external unmarshalled type
  >;
  // The shape of `RequestItems` depends on the batch-command being used
  RequestItems: "RequestItems" extends keyof SdkInput
    ? Record<string, Array<Record<keyof WriteRequest, any>>> extends SdkInput["RequestItems"]
      ? // BatchWriteItem RequestItems:
        MarshalledSdkFieldMeta<
          { [tableName: string]: Array<WriteRequest> }, //                 internal marshalled type from SDK
          { [tableName: string]: Array<UnmarshalledBatchWriteRequest> } // external unmarshalled type
        >
      : Record<string, Record<keyof KeysAndAttributes, any>> extends SdkInput["RequestItems"]
        ? // BatchGetItem RequestItems:
          MarshalledSdkFieldMeta<
            { [tableName: string]: FixPartialUndefined<KeysAndAttributes> }, // internal marshalled type from SDK
            { [tableName: string]: UnmarshalledKeysAndAttributes } //           external unmarshalled type
          >
        : never
    : never;
};

/**
 * Union of all SDK parameters that must be MARSHALLED before they can be used to create an SDK Command instance.
 */
export type SdkParameterThatRequiresMarshalling = Simplify<
  keyof SdkParamsThatRequireMarshalling<any>
>;

/**
 * ### SDK RESPONSE-FIELDS THAT REQUIRE UNMARSHALLING
 *
 * This type is a dictionary of SDK response-fields that must be **UNMARSHALLED** after an SDK
 * Command has been executed. Each response-field is mapped to a {@link MarshalledSdkFieldMeta}
 * type that defines its respective **MARSHALLED** and **UNMARSHALLED** types.
 */
type SdkResponseFieldsThatRequireUnmarshalling<SdkOutput extends object> = {
  Item?: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, // internal marshalled type from SDK
    BaseItem //                        external unmarshalled type
  >;
  Items?: MarshalledSdkFieldMeta<
    Array<Record<string, AttributeValue>>, // internal marshalled type from SDK
    Array<BaseItem> //                        external unmarshalled type
  >;
  Attributes?: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, // internal marshalled type from SDK
    BaseItem //                        external unmarshalled type
  >;
  LastEvaluatedKey?: MarshalledSdkFieldMeta<
    Record<string, AttributeValue>, // internal marshalled type from SDK
    ItemKeys //                        external unmarshalled type
  >;
  Responses?: MarshalledSdkFieldMeta<
    { [tableName: string]: Array<Record<string, AttributeValue>> }, // internal marshalled type from SDK
    { [tableName: string]: Array<BaseItem> } //                        external unmarshalled type
  >;
  UnprocessedKeys?: MarshalledSdkFieldMeta<
    { [tableName: string]: KeysAndAttributes }, //            internal marshalled type from SDK
    { [tableName: string]: UnmarshalledKeysAndAttributes } // external unmarshalled type
  >;
  UnprocessedItems?: MarshalledSdkFieldMeta<
    { [tableName: string]: Array<WriteRequest> }, //                 internal marshalled type from SDK
    { [tableName: string]: Array<UnmarshalledBatchWriteRequest> } // external unmarshalled type
  >;
  // The shape of `ItemCollectionMetrics` depends on whether the cmd is a batch operation or not
  ItemCollectionMetrics?: "ItemCollectionMetrics" extends keyof SdkOutput
    ? Record<keyof ItemCollectionMetrics, any> extends keyof SdkOutput["ItemCollectionMetrics"]
      ? // single-item operation ICM:
        MarshalledSdkFieldMeta<
          ItemCollectionMetrics, //            internal marshalled type from SDK
          UnmarshalledItemCollectionMetrics // external unmarshalled type
        >
      : // batch operation ICM:
        MarshalledSdkFieldMeta<
          { [tableName: string]: Array<ItemCollectionMetrics> }, //            internal marshalled type from SDK
          { [tableName: string]: Array<UnmarshalledItemCollectionMetrics> } // external unmarshalled type
        >
    : never;
};

/**
 * Union of all SDK response-fields that must be UNMARSHALLED after an SDK Command has been executed.
 */
export type SdkResponseFieldThatRequiresUnmarshalling = Simplify<
  keyof SdkResponseFieldsThatRequireUnmarshalling<any>
>;

///////////////////////////////////////////////////////////////////////////////////////////////////
// SDK TYPE MODIFIERS THAT USE THE ABOVE DICTIONARIES

/**
 * This generic takes a ddb client Command input or output type and modifies it as follows:
 * - Replaces _**marshalled**_ types with _**unmarshalled**_ types, and vice versa
 * - Removes all {@link OmittedSdkParameters|deprecated legacy parameters}
 * - Fixes the partiality of the resultant type by removing `undefined` from required fields
 */
type ModifySdkType<
  SdkType extends object,
  BaseFieldsDict extends { [fieldName: string]: MarshalledSdkFieldMeta },
  DictType extends keyof MarshalledSdkFieldMeta,
> = FixPartialUndefined<
  OverrideSharedProperties<
    Omit<SdkType, OmittedSdkParameters>,
    {
      [Field in keyof BaseFieldsDict]: Exclude<BaseFieldsDict[Field], undefined>[DictType];
    }
  >
>;

/**
 * This generic modifies the provided ddb Command-**input** type to use _**unmarshalled**_ values.
 */
export type ToUnmarshalledSdkInput<SdkInput extends object> = ModifySdkType<
  SdkInput,
  SdkParamsThatRequireMarshalling<SdkInput>,
  "UNMARSHALLED"
>;

/**
 * This generic modifies the provided ddb Command-**input** type to use _**marshalled**_ values.
 */
export type ToMarshalledSdkInput<SdkInput extends object> = ModifySdkType<
  SdkInput,
  SdkParamsThatRequireMarshalling<SdkInput>,
  "MARSHALLED"
>;

/**
 * This generic modifies the provided ddb Command-**output** type to use _**unmarshalled**_ values.
 */
export type ToUnmarshalledSdkOutput<SdkOutput extends object> = Simplify<
  ModifySdkType<
    SdkOutput,
    SdkResponseFieldsThatRequireUnmarshalling<SdkOutput>,
    "UNMARSHALLED" //
  > & {
    /* This "$metadata" addition shouldn't be necessary, since all of the impl'd output-types
      include it, but for some reason TS isn't recognizing the field in the parseClientResponse
      return-type, and explicitly adding it here fixes the issue for now. */
    $metadata: MetadataBearer["$metadata"];
  }
>;

/**
 * This generic modifies the provided ddb Command-**output** type to use _**marshalled**_ values.
 */
export type ToMarshalledSdkOutput<SdkOutput extends object> = ModifySdkType<
  SdkOutput,
  SdkResponseFieldsThatRequireUnmarshalling<SdkOutput>,
  "MARSHALLED"
>;
