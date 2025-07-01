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
  // SDK COMMAND TYPES
  type GetItemCommandOutput as SDKGetItemCmdOutput,
  type BatchGetItemCommandOutput as SDKBatchGetItemCmdOutput,
  type PutItemCommandOutput as SDKPutItemCmdOutput,
  type UpdateItemCommandOutput as SDKUpdateItemCmdOutput,
  type DeleteItemCommandOutput as SDKDeleteItemCmdOutput,
  type BatchWriteItemCommandOutput as SDKBatchWriteItemCmdOutput,
  type QueryCommandOutput as SDKQueryCmdOutput,
  type ScanCommandOutput as SDKScanCmdOutput,
  type TransactWriteItemsCommandOutput as SDKTransactWriteItemsCmdOutput,
} from "@aws-sdk/client-dynamodb";
import { isArray } from "@nerdware/ts-type-safety-utils";
import { DdbClientFieldParser } from "./DdbClientFieldParser.js";
import { handleBatchRequests, MAX_CHUNK_SIZE } from "./handleBatchRequests.js";
import type { TableConstructorParameters } from "../Table/index.js";
import type {
  DdbClientWrapperConstructorParameters,
  // MODEL-METHOD IO TYPES
  ClientWrapperGetItemInput,
  ClientWrapperGetItemOutput,
  ClientWrapperBatchGetItemInput,
  ClientWrapperBatchGetItemOutput,
  ClientWrapperPutItemInput,
  ClientWrapperPutItemOutput,
  ClientWrapperBatchWriteItemInput,
  ClientWrapperBatchWriteItemOutput,
  ClientWrapperUpdateItemInput,
  ClientWrapperUpdateItemOutput,
  ClientWrapperDeleteItemInput,
  ClientWrapperDeleteItemOutput,
  ClientWrapperQueryInput,
  ClientWrapperQueryOutput,
  ClientWrapperScanInput,
  ClientWrapperScanOutput,
  ClientWrapperTransactWriteItemsInput,
  ClientWrapperTransactWriteItemsOutput,
  // TABLE-METHOD IO TYPES
  ClientWrapperDescribeTableInput,
  ClientWrapperDescribeTableOutput,
  ClientWrapperCreateTableInput,
  ClientWrapperCreateTableOutput,
  ClientWrapperListTablesInput,
  ClientWrapperListTablesOutput,
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
export class DdbClientWrapper extends DdbClientFieldParser {
  /** The DynamoDB client instance. */
  private readonly _ddbClient: TableConstructorParameters["ddbClient"];

  constructor({ ddbClient, tableName, marshallingConfigs }: DdbClientWrapperConstructorParameters) {
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
  }: ClientWrapperGetItemInput): Promise<ClientWrapperGetItemOutput> => {
    // Create a GetItemCommand with marshalled `Key`
    const cmd = new GetItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Item`
    return this.parseClientResponse<SDKGetItemCmdOutput>(response, unmarshallOptions);
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
  }: ClientWrapperBatchGetItemInput): Promise<ClientWrapperBatchGetItemOutput> => {
    // Init variables to hold returned values:
    const returnedItems: Array<{ [attrName: string]: AttributeValue }> = [];
    const returnedConsumedCapacity: Array<ConsumedCapacity> = [];
    let returnedMetadata: ClientWrapperBatchGetItemOutput["$metadata"] = {};

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
      marshalledRequestItemsKeys,
      {
        chunkSize: MAX_CHUNK_SIZE.GetRequest,
        ...batchConfigs,
      }
    );

    return this.parseClientResponse<SDKBatchGetItemCmdOutput>(
      {
        ...(returnedItems.length > 0 && {
          Responses: { [this.tableName]: returnedItems },
        }),
        ...(unprocessedKeys && {
          UnprocessedKeys: { [this.tableName]: { Keys: unprocessedKeys } },
        }),
        ...(returnedConsumedCapacity.length > 0 && {
          ConsumedCapacity: returnedConsumedCapacity,
        }),
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
  }: ClientWrapperPutItemInput): Promise<ClientWrapperPutItemOutput> => {
    // Create a PutItemCommand with marshalled `Item` and `ExpressionAttributeValues`
    const cmd = new PutItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Attributes` and `ItemCollectionMetrics.ItemCollectionKey`
    return this.parseClientResponse<SDKPutItemCmdOutput>(response, unmarshallOptions);
  };

  /**
   * [`UpdateItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   */
  readonly updateItem = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: ClientWrapperUpdateItemInput): Promise<ClientWrapperUpdateItemOutput> => {
    // Create an UpdateItemCommand with marshalled `Key` and `ExpressionAttributeValues`
    const cmd = new UpdateItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Attributes` and `ItemCollectionMetrics.ItemCollectionKey`
    return this.parseClientResponse<SDKUpdateItemCmdOutput>(response, unmarshallOptions);
  };

  /**
   * [`DeleteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   */
  readonly deleteItem = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: ClientWrapperDeleteItemInput): Promise<ClientWrapperDeleteItemOutput> => {
    // Create a DeleteItemCommand with marshalled `Key` and `ExpressionAttributeValues`
    const cmd = new DeleteItemCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Attributes` and `ItemCollectionMetrics.ItemCollectionKey`
    return this.parseClientResponse<SDKDeleteItemCmdOutput>(response, unmarshallOptions);
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
  }: ClientWrapperBatchWriteItemInput): Promise<ClientWrapperBatchWriteItemOutput> => {
    // Init variables to hold returned values:
    const returnedItemCollectionMetrics: Array<ItemCollectionMetrics> = [];
    const returnedConsumedCapacity: Array<ConsumedCapacity> = [];
    let returnedMetadata: ClientWrapperBatchWriteItemOutput["$metadata"] = {};

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

    return this.parseClientResponse<SDKBatchWriteItemCmdOutput>(
      {
        ...(unprocessedItems && {
          UnprocessedItems: { [this.tableName]: unprocessedItems },
        }),
        ...(returnedConsumedCapacity.length > 0 && {
          ConsumedCapacity: returnedConsumedCapacity,
        }),
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
  }: ClientWrapperQueryInput = {}): Promise<ClientWrapperQueryOutput> => {
    // Create a QueryCommand with marshalled `ExclusiveStartKey` and `ExpressionAttributeValues`
    const cmd = new QueryCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Items` and `LastEvaluatedKey`
    return this.parseClientResponse<SDKQueryCmdOutput>(response, unmarshallOptions);
  };

  /**
   * [`Scan`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   */
  readonly scan = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: ClientWrapperScanInput = {}): Promise<ClientWrapperScanOutput> => {
    // Create a ScanCommand with marshalled `ExclusiveStartKey` and `ExpressionAttributeValues`
    const cmd = new ScanCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `Items` and `LastEvaluatedKey`
    return this.parseClientResponse<SDKScanCmdOutput>(response, unmarshallOptions);
  };

  /**
   * [`TransactWriteItems`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
   */
  readonly transactWriteItems = async ({
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
    ...args
  }: ClientWrapperTransactWriteItemsInput): Promise<ClientWrapperTransactWriteItemsOutput> => {
    // Create the TransactWriteItemsCommand command with marshalled `TransactItems`
    const cmd = new TransactWriteItemsCommand(this.prepCommandArgs(args, marshallOptions));
    // Send the command to the DynamoDB client
    const response = await this._ddbClient.send(cmd);
    // Return response with unmarshalled `ItemCollectionMetrics`
    return this.parseClientResponse<SDKTransactWriteItemsCmdOutput>(response, unmarshallOptions);
  };

  // CONTROL PLANE METHODS:

  /**
   * [`DescribeTable`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTable.html
   */
  readonly describeTable = async (
    args: ClientWrapperDescribeTableInput = {}
  ): Promise<ClientWrapperDescribeTableOutput> => {
    return await this._ddbClient.send(
      new DescribeTableCommand({ TableName: this.tableName, ...args })
    );
  };

  /**
   * [`CreateTable`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
   */
  readonly createTable = async (
    args: ClientWrapperCreateTableInput
  ): Promise<ClientWrapperCreateTableOutput> => {
    return await this._ddbClient.send(
      new CreateTableCommand({ TableName: this.tableName, ...args })
    );
  };

  /**
   * [`ListTables`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListTables.html
   */
  readonly listTables = async (
    args: ClientWrapperListTablesInput = {}
  ): Promise<ClientWrapperListTablesOutput> => {
    return await this._ddbClient.send(new ListTablesCommand(args));
  };
}
