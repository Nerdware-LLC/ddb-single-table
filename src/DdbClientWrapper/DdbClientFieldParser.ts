import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { isArray, safeJsonStringify } from "@nerdware/ts-type-safety-utils";
import { ItemInputError } from "../utils/errors.js";
import { convertJsDates } from "./convertJsDates.js";
import type {
  UnmarshalledBatchGetItemCommandInput,
  UnmarshalledBatchWriteItemCommandInput,
  // HELPER-METHOD TYPES
  MarshallingMethod,
  UnmarshallingMethod,
  SomeUnmarshalledCommandInput,
  SomeMarshalledCommandOutput,
  MarshallingConfigs,
  ToMarshalledSdkInput,
  ToUnmarshalledSdkOutput,
  DdbClientFieldParserConstructorParameters,
} from "./types/index.js";
import type { ItemCollectionMetrics } from "@aws-sdk/client-dynamodb";
import type { Simplify, RequiredDeep, AllUnionFields } from "type-fest";

/**
 * Utility class for preparing DynamoDB client command arguments and parsing client responses.
 */
export class DdbClientFieldParser {
  /**
   * Default {@link MarshallingConfigs} for the DynamoDB `marshall` and `unmarshall` util fns.
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

  protected readonly tableName: DdbClientFieldParserConstructorParameters["tableName"];
  protected readonly defaultMarshallingConfigs: Required<MarshallingConfigs>;

  constructor({ tableName, marshallingConfigs }: DdbClientFieldParserConstructorParameters) {
    this.tableName = tableName;
    this.defaultMarshallingConfigs = {
      marshallOptions: {
        ...DdbClientFieldParser.DEFAULT_MARSHALLING_CONFIGS.marshallOptions,
        ...marshallingConfigs?.marshallOptions,
      },
      unmarshallOptions: {
        ...DdbClientFieldParser.DEFAULT_MARSHALLING_CONFIGS.unmarshallOptions,
        ...marshallingConfigs?.unmarshallOptions,
      },
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // MARSHALLING UTIL METHODS:

  /** Invokes the `marshall` util function with the default marshalling configs. */
  readonly marshall: MarshallingMethod = (data, marshallOpts) => {
    return marshall(data, {
      ...this.defaultMarshallingConfigs.marshallOptions,
      ...marshallOpts,
    });
  };

  /** Converts JS `Date` objects to datetime strings, and then marshalls the result. */
  readonly marshallAndConvertDates: MarshallingMethod = (data, marshallOpts) => {
    return this.marshall(convertJsDates("toDB", data), marshallOpts);
  };

  /** Invokes the `unmarshall` util function with the default unmarshalling configs. */
  readonly unmarshall: UnmarshallingMethod = (data, unmarshallOpts) => {
    return unmarshall(data, {
      ...this.defaultMarshallingConfigs.unmarshallOptions,
      ...unmarshallOpts,
    });
  };

  /** Unmarshalls the provided `data`, and then converts datetime strings to JS `Date` objects. */
  readonly unmarshallAndConvertDates: UnmarshallingMethod = (data, unmarshallOpts) => {
    return convertJsDates("fromDB", this.unmarshall(data, unmarshallOpts));
  };

  /////////////////////////////////////////////////////////////////////////////
  // COMMAND-ARG PREP METHODS:

  private readonly isBatchGetItemRequestItems = (
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
      [this.tableName]: this.isBatchGetItemRequestItems(requestItems)
        ? {
            ...requestItems[this.tableName],
            Keys: requestItems[this.tableName].Keys.map((key) =>
              this.marshall(key, marshallOptions)
            ),
          }
        : requestItems[this.tableName].map((batchWriteReq) => {
            const { PutRequest, DeleteRequest } = batchWriteReq;
            if (PutRequest)
              return {
                PutRequest: {
                  Item: this.marshallAndConvertDates(PutRequest.Item, marshallOptions),
                },
              };
            if (DeleteRequest)
              return {
                DeleteRequest: {
                  Key: this.marshall(DeleteRequest.Key, marshallOptions),
                },
              };
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
      // Always add `TableName` UNLESS it's a batch or transaction command:
      ...(!requestItems && !transactItems && { TableName: this.tableName }),
      ...(key && { Key: this.marshall(key, marshallOpts) }),
      ...(item && { Item: this.marshallAndConvertDates(item, marshallOpts) }),
      ...(eav && { ExpressionAttributeValues: this.marshallAndConvertDates(eav, marshallOpts) }),
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
                ...(ccEAV && {
                  ExpressionAttributeValues: this.marshallAndConvertDates(ccEAV, marshallOpts),
                }),
              },
            }),
            ...(putItem && {
              Put: {
                ...putRest,
                TableName: this.tableName,
                Item: this.marshallAndConvertDates(putItem, marshallOpts),
                ...(putEAV && {
                  ExpressionAttributeValues: this.marshallAndConvertDates(putEAV, marshallOpts),
                }),
              },
            }),
            ...(updateKey && {
              Update: {
                ...updateRest,
                TableName: this.tableName,
                Key: this.marshall(updateKey, marshallOpts),
                ...(updEAV && {
                  ExpressionAttributeValues: this.marshallAndConvertDates(updEAV, marshallOpts),
                }),
              },
            }),
            ...(deleteKey && {
              Delete: {
                ...delRest,
                TableName: this.tableName,
                Key: this.marshall(deleteKey, marshallOpts),
                ...(delEAV && {
                  ExpressionAttributeValues: this.marshallAndConvertDates(delEAV, marshallOpts),
                }),
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
    ...(SizeEstimateRangeGB && {
      SizeEstimateRangeGB,
    }),
    ...(ItemCollectionKey && {
      ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
    }),
  });

  private readonly parseItemCollectionMetrics = (
    icMetrics: ItemCollectionMetrics | { [tableName: string]: Array<ItemCollectionMetrics> },
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
      ...(item && {
        Item: this.unmarshallAndConvertDates(item, unmarshallOptions),
      }),
      ...(items && {
        Items: items.map((item) => this.unmarshallAndConvertDates(item, unmarshallOptions)),
      }),
      ...(attributes && {
        Attributes: this.unmarshallAndConvertDates(attributes, unmarshallOptions),
      }),
      ...(lastEvalKey && {
        LastEvaluatedKey: this.unmarshall(lastEvalKey, unmarshallOptions),
      }),
      ...(icMetrics && {
        ItemCollectionMetrics: this.parseItemCollectionMetrics(icMetrics),
      }),
      ...(responses && {
        Responses: {
          [this.tableName]: responses[this.tableName].map((item) =>
            this.unmarshallAndConvertDates(item, unmarshallOptions)
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
          [this.tableName]: unprocessedItems[this.tableName].map(
            ({ PutRequest, DeleteRequest }) => ({
              ...(PutRequest && {
                PutRequest: {
                  Item: this.unmarshallAndConvertDates(PutRequest.Item ?? {}, unmarshallOptions),
                },
              }),
              ...(DeleteRequest && {
                DeleteRequest: {
                  Key: this.unmarshall(DeleteRequest.Key ?? {}, unmarshallOptions),
                },
              }),
            })
          ),
        },
      }),
      ...otherFields,
    } as ToUnmarshalledSdkOutput<MarshalledCmdOutput>;
  };
}
