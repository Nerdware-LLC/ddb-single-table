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
  type ItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { isArray } from "@nerdware/ts-type-safety-utils";
import { DdbClientArgParser } from "./DdbClientArgParser.js";
import { handleBatchRequests, MAX_CHUNK_SIZE } from "./handleBatchRequests.js";
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
  // BATCH OP TYPES
  BatchRequestFunction,
  GetRequest,
  WriteRequest,
} from "./types/index.js";

/**
 * A DynamoDB client wrapper with methods for instantiating DynamoDB client commands.
 * Where applicable, these wrapper methods also handle the following concerns:
 *
 * - Marshalling and unmarshalling of attribute values
 * - Conversion of JS `Date` objects to/from ISO-8601 datetime strings
 * - Batching/retry logic
 */
export class DdbClientWrapper extends DdbClientArgParser {
  /** The DynamoDB client instance. */
  private readonly _ddbClient: TableConstructorParams["ddbClient"];

  constructor({ ddbClient, tableName, marshallingConfigs }: DdbClientWrapperConstructorParams) {
    super({ tableName, marshallingConfigs });
    this._ddbClient = ddbClient;
  }

  /**
   * [`GetItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
   */
  readonly getItem = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: GetItemInput): Promise<GetItemOutput> => {
    // Create a GetItemCommand with marshalled `Key`
    const cmd = new GetItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Item`
    return this.parseClientResponse(response, unmarshallOptions);
  };

  /**
   * [`BatchGetItem`][api-ref] command wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   */
  readonly batchGetItems = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    batchConfigs = {},
    ...rawCmdArgs
  }: BatchGetItemsInput): Promise<BatchGetItemsOutput> => {
    // Init variables to hold returned values:
    const returnedItems: Array<{ [attrName: string]: AttributeValue }> = [];
    const returnedConsumedCapacity: Array<ConsumedCapacity> = [];
    let returnedMetadata: BatchGetItemsOutput["$metadata"] = {};

    // Create BatchGetItemCommand args with marshalled `RequestItems`
    const { RequestItems, ...cmdArgs } = this.prepCommandArgs(rawCmdArgs, marshallOptions);

    // Destructure the `KeysAndAttributes` object:
    const { Keys: marshalledRequestItemsKeys, ...nonKeyReqParams } = RequestItems[this.tableName];

    // Define the fn for the batch-requests handler, ensure it updates `returnedItems`
    const submitBatchGetItemRequest: BatchRequestFunction<GetRequest> = async (
      batchGetItemReqObjects
    ) => {
      const response = await this._ddbClient.send(
        new BatchGetItemCommand({
          ...cmdArgs,
          RequestItems: {
            [this.tableName]: {
              ...nonKeyReqParams,
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

    // Submit the function to the batch-requests handler
    const unprocessedKeys = await handleBatchRequests<GetRequest>(
      submitBatchGetItemRequest,
      marshalledRequestItemsKeys!,
      {
        chunkSize: MAX_CHUNK_SIZE.GetRequest,
        ...batchConfigs,
      }
    );

    return this.parseClientResponse(
      {
        ...(returnedItems.length > 0 && { Responses: { [this.tableName]: returnedItems } }),
        ...(unprocessedKeys && { UnprocessedKeys: unprocessedKeys }),
        ...(returnedConsumedCapacity.length > 0 && { ConsumedCapacity: returnedConsumedCapacity }),
        $metadata: returnedMetadata,
      },
      unmarshallOptions
    );
  };

  /**
   * [`PutItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   */
  readonly putItem = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: PutItemInput): Promise<PutItemOutput> => {
    // Create a PutItemCommand with marshalled `Item` and `ExpressionAttributeValues`
    const cmd = new PutItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Attributes` and `ItemCollectionMetrics.ItemCollectionKey`
    return this.parseClientResponse(response, unmarshallOptions);
  };

  /**
   * [`UpdateItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   */
  readonly updateItem = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: UpdateItemInput): Promise<UpdateItemOutput> => {
    // Create an UpdateItemCommand with marshalled `Key` and `ExpressionAttributeValues`
    const cmd = new UpdateItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Attributes` and `ItemCollectionMetrics.ItemCollectionKey`
    return this.parseClientResponse(response, unmarshallOptions);
  };

  /**
   * [`DeleteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   */
  readonly deleteItem = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: DeleteItemInput): Promise<DeleteItemOutput> => {
    // Create a DeleteItemCommand with marshalled `Key` and `ExpressionAttributeValues`
    const cmd = new DeleteItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Attributes` and `ItemCollectionMetrics.ItemCollectionKey`
    return this.parseClientResponse(response, unmarshallOptions);
  };

  /**
   * [`BatchWriteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   */
  readonly batchWriteItems = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    batchConfigs = {},
    ...rawCmdArgs
  }: BatchWriteItemsInput): Promise<BatchWriteItemsOutput> => {
    // Init variables to hold returned values:
    const returnedItemCollectionMetrics: Array<ItemCollectionMetrics> = [];
    const returnedConsumedCapacity: Array<ConsumedCapacity> = [];
    let returnedMetadata: BatchGetItemsOutput["$metadata"] = {};

    // Create BatchWriteItemCommand args with marshalled `RequestItems`
    const { RequestItems, ...cmdArgs } = this.prepCommandArgs(rawCmdArgs, marshallOptions);

    // Get the marshalled `RequestItems`
    const marshalledRequestItems = RequestItems[this.tableName];

    // Define the fn for the batch-requests handler, ensure it updates `returnedItems`
    const submitBatchWriteItemRequest: BatchRequestFunction<WriteRequest> = async (
      batchWriteItemReqObjects
    ) => {
      const response = await this._ddbClient.send(
        new BatchWriteItemCommand({
          ...cmdArgs,
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

    // Submit the function to the batch-requests handler
    const unprocessedItems = await handleBatchRequests<WriteRequest>(
      submitBatchWriteItemRequest,
      marshalledRequestItems, //
      {
        chunkSize: MAX_CHUNK_SIZE.WriteRequest,
        ...batchConfigs,
      }
    );

    return this.parseClientResponse(
      {
        UnprocessedItems: unprocessedItems,
        ...(returnedConsumedCapacity.length > 0 && { ConsumedCapacity: returnedConsumedCapacity }),
        ...(returnedItemCollectionMetrics.length > 0 && {
          ItemCollectionMetrics: { [this.tableName]: returnedItemCollectionMetrics },
        }),
        $metadata: returnedMetadata,
      },
      unmarshallOptions
    );
  };

  /**
   * [`Query`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
   */
  readonly query = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: QueryInput = {}): Promise<QueryOutput> => {
    // Create a QueryCommand with marshalled `ExclusiveStartKey` and `ExpressionAttributeValues`
    const cmd = new QueryCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Items` and `LastEvaluatedKey`
    return this.parseClientResponse(response, unmarshallOptions);
  };

  /**
   * [`Scan`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   */
  readonly scan = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: ScanInput = {}): Promise<ScanOutput> => {
    // Create a ScanCommand with marshalled `ExclusiveStartKey` and `ExpressionAttributeValues`
    const cmd = new ScanCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Items` and `LastEvaluatedKey`
    return this.parseClientResponse(response, unmarshallOptions);
  };

  /**
   * [`TransactWriteItems`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
   */
  readonly transactWriteItems = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: TransactWriteItemsInput): Promise<TransactWriteItemsOutput> => {
    // Create the TransactWriteItemsCommand command with marshalled `TransactItems`
    const cmd = new TransactWriteItemsCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `ItemCollectionMetrics`
    return this.parseClientResponse(response, unmarshallOptions);
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
