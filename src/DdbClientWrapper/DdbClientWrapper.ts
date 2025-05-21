import {
  // MODEL-METHOD COMMANDS
  GetItemCommand,
  BatchGetItemCommand,
  PutItemCommand,
  BatchWriteItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteItemsCommand,
  // TABLE-METHOD COMMANDS
  DescribeTableCommand,
  CreateTableCommand,
  ListTablesCommand,
  // TYPES
  type AttributeValue,
  type ConsumedCapacity,
  type WriteRequest,
  type ItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { isArray } from "@nerdware/ts-type-safety-utils";
import { ItemInputError } from "../utils/errors.js";
import { DEFAULT_MARSHALLING_CONFIGS, type MarshallingConfigs } from "../utils/index.js";
import { handleBatchRequests } from "./handleBatchRequests.js";
import type { TableConstructorParams } from "../Table/index.js";
import type {
  DdbClientWrapperConstructorParams,
  // MODEL-METHOD IO TYPES
  GetItemInput,
  GetItemOutput,
  BatchGetItemsInput,
  BatchGetItemsOutput,
  PutItemInput,
  PutItemOutput,
  BatchWriteItemsInput,
  BatchWriteItemsOutput,
  UpdateItemInput,
  UpdateItemOutput,
  DeleteItemInput,
  DeleteItemOutput,
  QueryInput,
  QueryOutput,
  ScanInput,
  ScanOutput,
  TransactWriteItemsInput,
  TransactWriteItemsOutput,
  // TABLE-METHOD IO TYPES
  DescribeTableInput,
  DescribeTableOutput,
  CreateTableInput,
  CreateTableOutput,
  ListTablesInput,
  ListTablesOutput,
  // OTHER TYPES
  BatchRequestFunction,
} from "./types/index.js";
import type { NativeAttributeValue } from "../types/index.js";

/**
 * A unified DynamoDB client with methods for instantiating DynamoDB client commands.
 * Where applicable, these wrapper methods also handle marshalling and unmarshalling
 * of attribute values, as well as batching/retry logic.
 */
export class DdbClientWrapper {
  /** The DynamoDB client instance. */
  private readonly _ddbClient: TableConstructorParams["ddbClient"];
  private readonly tableName: TableConstructorParams["tableName"];
  private readonly defaultMarshallingConfigs: Required<MarshallingConfigs>;

  /** Invokes the `marshall` util function with the default marshalling configs. */
  marshall = (
    data: Record<string, NativeAttributeValue>,
    options?: MarshallingConfigs["marshallOptions"]
  ) => {
    return marshall(data, {
      ...this.defaultMarshallingConfigs.marshallOptions,
      ...options,
    });
  };

  /** Invokes the `unmarshall` util function with the default unmarshalling configs. */
  unmarshall = (...[data, options]: Parameters<typeof unmarshall>) => {
    return unmarshall(data, {
      ...this.defaultMarshallingConfigs.unmarshallOptions,
      ...options,
    });
  };

  constructor({ ddbClient, tableName, marshallingConfigs }: DdbClientWrapperConstructorParams) {
    this._ddbClient = ddbClient;
    this.tableName = tableName;
    this.defaultMarshallingConfigs = {
      marshallOptions: {
        ...DEFAULT_MARSHALLING_CONFIGS.marshallOptions,
        ...marshallingConfigs?.marshallOptions,
      },
      unmarshallOptions: {
        ...DEFAULT_MARSHALLING_CONFIGS.unmarshallOptions,
        ...marshallingConfigs?.unmarshallOptions,
      },
    };
  }

  /**
   * [`GetItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
   */
  readonly getItem = async ({
    Key,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: GetItemInput): Promise<GetItemOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new GetItemCommand({
      TableName: this.tableName,
      Key: this.marshall(Key, marshallOptions),
      ...args,
    });

    const { Item, ...cmdOutput } = await this._ddbClient.send(cmd);

    return {
      ...(Item && { Item: this.unmarshall(Item, unmarshallOptions) }),
      ...cmdOutput,
    };
  };

  /**
   * [`BatchGetItem`][api-ref] command wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   */
  readonly batchGetItems = async ({
    RequestItems,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    exponentialBackoffConfigs,
    ...args
  }: BatchGetItemsInput): Promise<BatchGetItemsOutput> => {
    // Init variables to hold returned values:
    const returnedItems: Array<{ [attrName: string]: AttributeValue }> = [];
    const returnedConsumedCapacity: Array<ConsumedCapacity> = [];
    let returnedMetadata: BatchGetItemsOutput["$metadata"] = {};

    // Define the fn for the batch-requests handler, ensure it updates `returnedItems`
    const submitBatchGetItemRequest: BatchRequestFunction<{
      [attrName: string]: AttributeValue;
    }> = async (batchGetItemReqObjects) => {
      const response = await this._ddbClient.send(
        new BatchGetItemCommand({
          ...args,
          RequestItems: {
            [this.tableName]: {
              Keys: batchGetItemReqObjects,
            },
          },
        })
      );
      // Destructure relevant fields from the `response`
      const { Responses, ConsumedCapacity, UnprocessedKeys, $metadata } = response;
      // If the response returned items, add them to the `returnedItems` array
      if (isArray(Responses?.[this.tableName])) returnedItems.push(...Responses[this.tableName]);
      // Handle ConsumedCapacity
      if (isArray(ConsumedCapacity)) returnedConsumedCapacity.push(...ConsumedCapacity);
      // Handle $metadata
      returnedMetadata = $metadata;
      // Return any unprocessed keys
      return UnprocessedKeys?.[this.tableName]?.Keys;
    };

    // Marshall the `Keys` values in RequestItems
    const marshalledRequestItemsKeys = RequestItems[this.tableName].Keys.map((item) =>
      this.marshall(item, marshallOptions)
    );

    // Submit the function to the batch-requests handler
    await handleBatchRequests<{ [attrName: string]: AttributeValue }>(
      submitBatchGetItemRequest,
      marshalledRequestItemsKeys,
      100, // <-- chunk size
      exponentialBackoffConfigs
    );

    return {
      ...(returnedItems.length > 0 && {
        Responses: {
          [this.tableName]: returnedItems.map((item) => this.unmarshall(item, unmarshallOptions)),
        },
      }),
      ...(returnedConsumedCapacity.length > 0 && {
        ConsumedCapacity: returnedConsumedCapacity,
      }),
      $metadata: returnedMetadata,
    };
  };

  /**
   * [`PutItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   */
  readonly putItem = async ({
    Item,
    ExpressionAttributeValues,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: PutItemInput): Promise<PutItemOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new PutItemCommand({
      TableName: this.tableName,
      Item: this.marshall(Item, marshallOptions),
      ...(ExpressionAttributeValues && {
        ExpressionAttributeValues: this.marshall(ExpressionAttributeValues, marshallOptions),
      }),
      ...args,
    });

    const { Attributes, ItemCollectionMetrics, ...cmdOutput } = await this._ddbClient.send(cmd);

    const { ItemCollectionKey, SizeEstimateRangeGB } = ItemCollectionMetrics ?? {};

    return {
      ...(Attributes && { Attributes: this.unmarshall(Attributes, unmarshallOptions) }),
      ...(ItemCollectionMetrics && {
        ItemCollectionMetrics: {
          ...(ItemCollectionKey && {
            ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
          }),
          ...(SizeEstimateRangeGB && { SizeEstimateRangeGB }),
        },
      }),
      ...cmdOutput,
    };
  };

  /**
   * [`UpdateItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   */
  readonly updateItem = async ({
    Key,
    ExpressionAttributeValues,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: UpdateItemInput): Promise<UpdateItemOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new UpdateItemCommand({
      TableName: this.tableName,
      Key: this.marshall(Key, marshallOptions),
      ...(ExpressionAttributeValues && {
        ExpressionAttributeValues: this.marshall(ExpressionAttributeValues, marshallOptions),
      }),
      ...args,
    });

    const { Attributes, ItemCollectionMetrics, ...cmdOutput } = await this._ddbClient.send(cmd);

    const { ItemCollectionKey, SizeEstimateRangeGB } = ItemCollectionMetrics ?? {};

    return {
      ...(Attributes && { Attributes: this.unmarshall(Attributes, unmarshallOptions) }),
      ...(ItemCollectionMetrics && {
        ItemCollectionMetrics: {
          ...(ItemCollectionKey && {
            ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
          }),
          ...(SizeEstimateRangeGB && { SizeEstimateRangeGB }),
        },
      }),
      ...cmdOutput,
    };
  };

  /**
   * [`DeleteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   */
  readonly deleteItem = async ({
    Key,
    ExpressionAttributeValues,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: DeleteItemInput): Promise<DeleteItemOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new DeleteItemCommand({
      TableName: this.tableName,
      Key: this.marshall(Key, marshallOptions),
      ...(ExpressionAttributeValues && {
        ExpressionAttributeValues: this.marshall(ExpressionAttributeValues, marshallOptions),
      }),
      ...args,
    });

    const { Attributes, ItemCollectionMetrics, ...cmdOutput } = await this._ddbClient.send(cmd);

    const { ItemCollectionKey, SizeEstimateRangeGB } = ItemCollectionMetrics ?? {};

    return {
      ...(Attributes && { Attributes: this.unmarshall(Attributes, unmarshallOptions) }),
      ...(ItemCollectionMetrics && {
        ItemCollectionMetrics: {
          ...(ItemCollectionKey && {
            ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
          }),
          ...(SizeEstimateRangeGB && { SizeEstimateRangeGB }),
        },
      }),
      ...cmdOutput,
    };
  };

  /**
   * [`BatchWriteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   */
  readonly batchWriteItems = async ({
    RequestItems,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    exponentialBackoffConfigs,
    ...args
  }: BatchWriteItemsInput): Promise<BatchWriteItemsOutput> => {
    // Init variables to hold returned values:
    const returnedItemCollectionMetrics: Array<ItemCollectionMetrics> = [];
    const returnedConsumedCapacity: Array<ConsumedCapacity> = [];
    let returnedMetadata: BatchGetItemsOutput["$metadata"] = {};

    // Define the fn for the batch-requests handler, ensure it updates `returnedItems`
    const submitBatchWriteItemRequest: BatchRequestFunction<WriteRequest> = async (
      batchWriteItemReqObjects
    ) => {
      const response = await this._ddbClient.send(
        new BatchWriteItemCommand({
          ...args,
          RequestItems: {
            [this.tableName]: batchWriteItemReqObjects,
          },
        })
      );
      // Destructure relevant fields from the `response`
      const { ItemCollectionMetrics, ConsumedCapacity, UnprocessedItems, $metadata } = response;
      // If the response returned ItemCollectionMetrics, add them to the returned array
      if (isArray(ItemCollectionMetrics?.[this.tableName]))
        returnedItemCollectionMetrics.push(...ItemCollectionMetrics[this.tableName]);
      // Handle ConsumedCapacity
      if (isArray(ConsumedCapacity)) returnedConsumedCapacity.push(...ConsumedCapacity);
      // Handle $metadata
      returnedMetadata = $metadata;
      // Return any unprocessed items
      return UnprocessedItems?.[this.tableName];
    };

    // Marshall the `RequestItems`
    const marshalledRequestItems = RequestItems[this.tableName].reduce(
      (accum: Array<WriteRequest>, writeRequest) => {
        if (writeRequest.PutRequest) {
          accum.push({
            PutRequest: {
              Item: this.marshall(writeRequest.PutRequest.Item, marshallOptions),
            },
          });
        } else if (writeRequest.DeleteRequest) {
          accum.push({
            DeleteRequest: {
              Key: this.marshall(writeRequest.DeleteRequest.Key, marshallOptions),
            },
          });
        } else {
          throw new ItemInputError(
            `Invalid request item: ${JSON.stringify(writeRequest)}. `
              + `Expected a PutRequest or DeleteRequest.`
          );
        }
        return accum;
      },
      []
    );

    // Submit the function to the batch-requests handler
    await handleBatchRequests<WriteRequest>(
      submitBatchWriteItemRequest,
      marshalledRequestItems,
      100, // <-- chunk size
      exponentialBackoffConfigs
    );

    return {
      ...(returnedItemCollectionMetrics.length > 0 && {
        ItemCollectionMetrics: {
          [this.tableName]: returnedItemCollectionMetrics.map(
            ({ ItemCollectionKey, SizeEstimateRangeGB }) => ({
              ...(ItemCollectionKey && {
                ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
              }),
              ...(SizeEstimateRangeGB && { SizeEstimateRangeGB }),
            })
          ),
        },
      }),
      ...(returnedConsumedCapacity.length > 0 && {
        ConsumedCapacity: returnedConsumedCapacity,
      }),
      $metadata: returnedMetadata,
    };
  };

  /**
   * [`Query`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
   */
  readonly query = async ({
    ExclusiveStartKey,
    ExpressionAttributeValues,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: QueryInput = {}): Promise<QueryOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new QueryCommand({
      TableName: this.tableName,
      ...(ExclusiveStartKey && {
        ExclusiveStartKey: this.marshall(ExclusiveStartKey, marshallOptions),
      }),
      ...(ExpressionAttributeValues && {
        ExpressionAttributeValues: this.marshall(ExpressionAttributeValues, marshallOptions),
      }),
      ...args,
    });

    const { Items, LastEvaluatedKey, ...cmdOutput } = await this._ddbClient.send(cmd);

    return {
      ...(Items && {
        Items: Items.map((item) => this.unmarshall(item, unmarshallOptions)),
      }),
      ...(LastEvaluatedKey && {
        LastEvaluatedKey: this.unmarshall(LastEvaluatedKey, unmarshallOptions),
      }),
      ...cmdOutput,
    };
  };

  /**
   * [`Scan`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   */
  readonly scan = async ({
    ExclusiveStartKey,
    ExpressionAttributeValues,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: ScanInput = {}): Promise<ScanOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new ScanCommand({
      TableName: this.tableName,
      ...(ExclusiveStartKey && {
        ExclusiveStartKey: this.marshall(ExclusiveStartKey, marshallOptions),
      }),
      ...(ExpressionAttributeValues && {
        ExpressionAttributeValues: this.marshall(ExpressionAttributeValues, marshallOptions),
      }),
      ...args,
    });

    const { Items, LastEvaluatedKey, ...cmdOutput } = await this._ddbClient.send(cmd);

    return {
      ...(Items && {
        Items: Items.map((item) => this.unmarshall(item, unmarshallOptions)),
      }),
      ...(LastEvaluatedKey && {
        LastEvaluatedKey: this.unmarshall(LastEvaluatedKey, unmarshallOptions),
      }),
      ...cmdOutput,
    };
  };

  /**
   * [`TransactWriteItems`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
   */
  readonly transactWriteItems = async ({
    TransactItems,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: TransactWriteItemsInput): Promise<TransactWriteItemsOutput> => {
    // Create the command with marshalled attribute values
    const cmd = new TransactWriteItemsCommand({
      ...args,
      TransactItems: TransactItems.map(
        // Destructure the transactWriteItem to get the relevant fields
        ({
          ConditionCheck: {
            Key: ccKey,
            ConditionExpression: ccConditionExpr,
            ExpressionAttributeValues: ccEAV,
            ...conCheckRest
          } = {},
          Put: { Item: putItem, ExpressionAttributeValues: putEAV, ...putRest } = {},
          Update: {
            Key: updateKey,
            UpdateExpression: updateExpr,
            ExpressionAttributeValues: updateEAV,
            ...updateRest
          } = {},
          Delete: { Key: deleteKey, ExpressionAttributeValues: deleteEAV, ...deleteRest } = {},
        }) => ({
          ...(ccKey && {
            ConditionCheck: {
              ...conCheckRest,
              TableName: this.tableName,
              Key: this.marshall(ccKey, marshallOptions),
              ConditionExpression: ccConditionExpr!,
              ...(ccEAV && { ExpressionAttributeValues: this.marshall(ccEAV, marshallOptions) }),
            },
          }),
          ...(putItem && {
            Put: {
              ...putRest,
              TableName: this.tableName,
              Item: this.marshall(putItem, marshallOptions),
              ...(putEAV && { ExpressionAttributeValues: this.marshall(putEAV, marshallOptions) }),
            },
          }),
          ...(updateKey && {
            Update: {
              ...updateRest,
              TableName: this.tableName,
              Key: this.marshall(updateKey, marshallOptions),
              UpdateExpression: updateExpr!,
              ...(updateEAV && { ExpressionAttributeValues: this.marshall(updateEAV, marshallOptions) }), // prettier-ignore
            },
          }),
          ...(deleteKey && {
            Delete: {
              ...deleteRest,
              TableName: this.tableName,
              Key: this.marshall(deleteKey, marshallOptions),
              ...(deleteEAV && { ExpressionAttributeValues: this.marshall(deleteEAV, marshallOptions) }), // prettier-ignore
            },
          }),
        })
      ),
    });

    const { ItemCollectionMetrics, ...cmdOutput } = await this._ddbClient.send(cmd);

    return {
      ...(ItemCollectionMetrics && {
        ItemCollectionMetrics: {
          [this.tableName]: ItemCollectionMetrics[this.tableName].map(
            ({ ItemCollectionKey, SizeEstimateRangeGB }) => ({
              ...(ItemCollectionKey && {
                ItemCollectionKey: this.unmarshall(ItemCollectionKey, unmarshallOptions),
              }),
              ...(SizeEstimateRangeGB && { SizeEstimateRangeGB }),
            })
          ),
        },
      }),
      ...cmdOutput,
    };
  };

  // CONTROL PLANE METHODS:

  /**
   * [`DescribeTable`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTable.html
   */
  readonly describeTable = async (args: DescribeTableInput = {}): Promise<DescribeTableOutput> => {
    return await this._ddbClient.send(
      new DescribeTableCommand({ TableName: this.tableName, ...args })
    );
  };

  /**
   * [`CreateTable`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
   */
  readonly createTable = async (args: CreateTableInput): Promise<CreateTableOutput> => {
    return await this._ddbClient.send(
      new CreateTableCommand({ TableName: this.tableName, ...args })
    );
  };

  /**
   * [`ListTables`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListTables.html
   */
  readonly listTables = async (args: ListTablesInput = {}): Promise<ListTablesOutput> => {
    return await this._ddbClient.send(new ListTablesCommand(args));
  };
}
