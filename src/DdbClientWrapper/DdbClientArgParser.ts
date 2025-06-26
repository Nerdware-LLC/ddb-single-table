import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { isArray, safeJsonStringify } from "@nerdware/ts-type-safety-utils";
import { ItemInputError } from "../utils/errors.js";
import type { TableConstructorParams } from "../Table/index.js";
import type { NativeAttributeValue } from "../types/index.js";
import type {
  UnmarshalledBatchGetItemCommandInput,
  UnmarshalledBatchWriteItemCommandInput,
  // HELPER-METHOD TYPES
  SomeUnmarshalledCommandInput,
  SomeMarshalledCommandOutput,
  MarshallingConfigs,
  ToMarshalledSdkInput,
  ToUnmarshalledSdkOutput,
  DdbClientWrapperConstructorParams,
} from "./types/index.js";
import type { ItemCollectionMetrics } from "@aws-sdk/client-dynamodb";
import type { Simplify, RequiredDeep, AllUnionFields } from "type-fest";

/**
 * Utility class for preparing DynamoDB client command arguments and parsing client responses.
 */
export class DdbClientArgParser {
  /**
   * Default {@link MarshallingConfigs} for the DynamoDB client.
   * > Note: the SDK defaults all of these options to `false`.
   */
  static readonly DEFAULT_MARSHALLING_CONFIGS = {
    marshallOptions: {
      convertEmptyValues: false,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
      convertTopLevelContainer: false,
      allowImpreciseNumbers: false,
    },
    unmarshallOptions: {
      wrapNumbers: false,
      convertWithoutMapWrapper: false,
    },
  } as const satisfies RequiredDeep<MarshallingConfigs>;

  /** The DynamoDB client instance. */
  protected readonly tableName: TableConstructorParams["tableName"];
  protected readonly defaultMarshallingConfigs: Required<MarshallingConfigs>;

  /** Invokes the `marshall` util function with the default marshalling configs. */
  readonly marshall = (
    data: Record<string, NativeAttributeValue>,
    options?: MarshallingConfigs["marshallOptions"]
  ) => {
    return marshall(data, {
      ...this.defaultMarshallingConfigs.marshallOptions,
      ...options,
    });
  };

  /** Invokes the `unmarshall` util function with the default unmarshalling configs. */
  readonly unmarshall = (...[data, options]: Parameters<typeof unmarshall>) => {
    return unmarshall(data, {
      ...this.defaultMarshallingConfigs.unmarshallOptions,
      ...options,
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // COMMAND-ARG PREP METHODS:

  private readonly isBatchGetRequestItems = (
    requestItems:
      | UnmarshalledBatchGetItemCommandInput["RequestItems"]
      | UnmarshalledBatchWriteItemCommandInput["RequestItems"]
  ): requestItems is UnmarshalledBatchGetItemCommandInput["RequestItems"] => {
    return !isArray(requestItems[this.tableName]);
  };

  private readonly prepRequestItems = (
    requestItems:
      | UnmarshalledBatchGetItemCommandInput["RequestItems"]
      | UnmarshalledBatchWriteItemCommandInput["RequestItems"],
    marshallOptions?: MarshallingConfigs["marshallOptions"]
  ) => {
    return {
      [this.tableName]: this.isBatchGetRequestItems(requestItems)
        ? {
            ...requestItems[this.tableName],
            Keys: requestItems[this.tableName].Keys.map((key) =>
              this.marshall(key, marshallOptions)
            ),
          }
        : requestItems[this.tableName].map((batchWriteReq) => {
            const { PutRequest, DeleteRequest } = batchWriteReq;
            // FIXME Date conversion on PutRequest.Item
            if (PutRequest)
              return { PutRequest: { Item: this.marshall(PutRequest.Item, marshallOptions) } };
            if (DeleteRequest)
              return { DeleteRequest: { Key: this.marshall(DeleteRequest.Key, marshallOptions) } };
            throw new ItemInputError(
              `Invalid request item for BatchWriteItem operation.
                Expected a valid PutRequest or DeleteRequest.
                Received: ${safeJsonStringify(batchWriteReq)}`
            );
          }),
    };
  };

  /**
   * This method prepares command arguments for DynamoDB client commands:
   * - Adds the `TableName` parameter
   * - Marshalls attribute values (`Key`, `Item`, `ExpressionAttributeValues`, etc.)
   * - Converts JS Date objects to ISO-8601 datetime strings
   */
  readonly prepCommandArgs = <UnmarshalledCmdInput extends SomeUnmarshalledCommandInput>(
    unmarshalledCommandArgs: UnmarshalledCmdInput,
    marshallOpts?: MarshallingConfigs["marshallOptions"]
  ) => {
    // Destructure fields that require marshalling:
    const {
      Key: key,
      Item: item,
      ExpressionAttributeValues: eav,
      ExclusiveStartKey: exclStartKey,
      RequestItems: requestItems,
      TransactItems: transactItems,
      ...otherCommandArgs
    } = unmarshalledCommandArgs as AllUnionFields<SomeUnmarshalledCommandInput>;

    return {
      TableName: this.tableName,
      ...(key && { Key: this.marshall(key, marshallOpts) }),
      // FIXME Date conversion on Item
      ...(item && { Item: this.marshall(item, marshallOpts) }),
      // FIXME Date conversion on ExpressionAttributeValues
      ...(eav && { ExpressionAttributeValues: this.marshall(eav, marshallOpts) }),
      ...(exclStartKey && { ExclusiveStartKey: this.marshall(exclStartKey, marshallOpts) }),
      ...(requestItems && { RequestItems: this.prepRequestItems(requestItems, marshallOpts) }),
      ...(transactItems && {
        TransactItems: transactItems.map(
          // Destructure the transactWriteItem to get the relevant fields
          ({
            ConditionCheck: { Key: ccKey, ExpressionAttributeValues: ccEAV, ...ccRest } = {},
            Put: { Item: putItem, ExpressionAttributeValues: putEAV, ...putRest } = {},
            Update: { Key: updateKey, ExpressionAttributeValues: updEAV, ...updateRest } = {},
            Delete: { Key: deleteKey, ExpressionAttributeValues: delEAV, ...delRest } = {},
          }) => ({
            ...(ccKey && {
              ConditionCheck: {
                ...ccRest,
                TableName: this.tableName,
                Key: this.marshall(ccKey, marshallOpts),
                // FIXME Date conversion would need to happen here
                ...(ccEAV && { ExpressionAttributeValues: this.marshall(ccEAV, marshallOpts) }),
              },
            }),
            ...(putItem && {
              Put: {
                ...putRest,
                TableName: this.tableName,
                // FIXME Date conversion would need to happen here.
                Item: this.marshall(putItem, marshallOpts),
                // FIXME Date conversion would need to happen here.
                ...(putEAV && { ExpressionAttributeValues: this.marshall(putEAV, marshallOpts) }),
              },
            }),
            ...(updateKey && {
              Update: {
                ...updateRest,
                TableName: this.tableName,
                Key: this.marshall(updateKey, marshallOpts),
                // FIXME Date conversion would need to happen here
                ...(updEAV && { ExpressionAttributeValues: this.marshall(updEAV, marshallOpts) }),
              },
            }),
            ...(deleteKey && {
              Delete: {
                ...delRest,
                TableName: this.tableName,
                Key: this.marshall(deleteKey, marshallOpts),
                // FIXME Date conversion would need to happen here
                ...(delEAV && { ExpressionAttributeValues: this.marshall(delEAV, marshallOpts) }),
              },
            }),
          })
        ),
      }),
      ...otherCommandArgs,
    } as Simplify<{ TableName: string } & ToMarshalledSdkInput<UnmarshalledCmdInput>>;
  };

  /////////////////////////////////////////////////////////////////////////////
  // RESPONSE-PARSING METHODS:

  private readonly isSingleItemCollectionMetrics = (
    icMetrics: ItemCollectionMetrics | Record<string, Array<ItemCollectionMetrics>>
  ): icMetrics is ItemCollectionMetrics => {
    return !!icMetrics.ItemCollectionKey || !!icMetrics.SizeEstimateRangeGB;
  };

  private readonly parseSingleItemCollectionMetrics = (
    { ItemCollectionKey, SizeEstimateRangeGB }: ItemCollectionMetrics,
    unmarshallOptions?: MarshallingConfigs["unmarshallOptions"]
  ) => ({
    ...(SizeEstimateRangeGB && { SizeEstimateRangeGB }),
    ...(ItemCollectionKey && {
      ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
    }),
  });

  private readonly parseItemCollectionMetrics = (
    icMetrics: ItemCollectionMetrics | Record<string, Array<ItemCollectionMetrics>>,
    unmarshallOptions?: MarshallingConfigs["unmarshallOptions"]
  ) => {
    return this.isSingleItemCollectionMetrics(icMetrics)
      ? this.parseSingleItemCollectionMetrics(icMetrics, unmarshallOptions)
      : {
          [this.tableName]: icMetrics[this.tableName].map((icm) =>
            this.parseSingleItemCollectionMetrics(icm, unmarshallOptions)
          ),
        };
  };

  /**
   * This method parses dynamodb-client reponses:
   * - Unmarshalls attribute values (`Item`, `Items`, `Attributes`, `ItemCollectionKey`, etc.)
   * - Converts ISO-8601 datetime strings to JS Date objects
   */
  readonly parseClientResponse = <MarshalledCmdOutput extends SomeMarshalledCommandOutput>(
    clientResponse: MarshalledCmdOutput,
    unmarshallOptions?: MarshallingConfigs["unmarshallOptions"]
  ) => {
    // Destructure fields that require unmarshalling:
    const {
      Item: item,
      Items: items,
      Attributes: attributes,
      LastEvaluatedKey: lastEvalKey,
      ItemCollectionMetrics: icMetrics,
      Responses: responses,
      UnprocessedKeys: unprocessedKeys,
      UnprocessedItems: unprocessedItems,
      ...otherFields
    } = clientResponse as AllUnionFields<SomeMarshalledCommandOutput>;

    return {
      // FIXME Date conversion on Item
      ...(item && { Item: this.unmarshall(item, unmarshallOptions) }),
      // FIXME Date conversion on each `item` here
      ...(items && { Items: items.map((item) => this.unmarshall(item, unmarshallOptions)) }),
      // FIXME Date conversion on Attributes
      ...(attributes && { Attributes: this.unmarshall(attributes, unmarshallOptions) }),
      ...(lastEvalKey && { LastEvaluatedKey: this.unmarshall(lastEvalKey, unmarshallOptions) }),
      ...(icMetrics && { ItemCollectionMetrics: this.parseItemCollectionMetrics(icMetrics) }),
      ...(responses && {
        Responses: {
          // FIXME Date conversion on each `item` here
          [this.tableName]: responses[this.tableName].map((item) =>
            this.unmarshall(item, unmarshallOptions)
          ),
        },
      }),
      ...(isArray(unprocessedKeys?.[this.tableName]?.Keys) && {
        UnprocessedKeys: {
          [this.tableName]: {
            ...unprocessedKeys[this.tableName],
            Keys: unprocessedKeys[this.tableName].Keys!.map((key) =>
              this.unmarshall(key, unmarshallOptions)
            ),
          },
        },
      }),
      ...(isArray(unprocessedItems?.[this.tableName]) && {
        UnprocessedItems: {
          [this.tableName]: unprocessedItems[this.tableName].map((batchWriteReq) => {
            const { PutRequest, DeleteRequest } = batchWriteReq;
            if (PutRequest)
              return {
                PutRequest: { Item: this.unmarshall(PutRequest.Item ?? {}, unmarshallOptions) },
              };
            if (DeleteRequest)
              return {
                DeleteRequest: { Key: this.unmarshall(DeleteRequest.Key ?? {}, unmarshallOptions) },
              };
            return batchWriteReq; // Should never happen, but just in case
          }),
        },
      }),
      ...otherFields,
    } as ToUnmarshalledSdkOutput<MarshalledCmdOutput>;
  };

  /////////////////////////////////////////////////////////////////////////////

  constructor({
    tableName,
    marshallingConfigs,
  }: Pick<DdbClientWrapperConstructorParams, "tableName" | "marshallingConfigs">) {
    this.tableName = tableName;
    this.defaultMarshallingConfigs = {
      marshallOptions: {
        ...DdbClientArgParser.DEFAULT_MARSHALLING_CONFIGS.marshallOptions,
        ...marshallingConfigs?.marshallOptions,
      },
      unmarshallOptions: {
        ...DdbClientArgParser.DEFAULT_MARSHALLING_CONFIGS.unmarshallOptions,
        ...marshallingConfigs?.unmarshallOptions,
      },
    };
  }
}
