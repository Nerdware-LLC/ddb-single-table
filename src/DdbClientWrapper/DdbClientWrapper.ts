import {
  DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
  PutCommand,
  BatchWriteCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  DdbClientWrapperConstructorParams,
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
  DescribeTableInput,
  DescribeTableOutput,
  CreateTableInput,
  CreateTableOutput,
  ListTablesInput,
  ListTablesOutput,
} from "./types.js";

/**
 * A unified DynamoDB client with methods for instantiating DynamoDB client commands. Where
 * applicable, these wrapper methods also handle batching/retry logic.
 *
 * For commands which are supported by both the client (`client-dynamodb`) and the doc-client
 * (`lib-dynamodb`), the doc-client is used in order to take advantage of the package's automatic
 * data marshalling/unmarshalling features. However, the doc-client does not support commands
 * related to control plane operations like `DescribeTable`, `ListTables`, etc., so for these
 * commands the base client is used instead.
 */
export class DdbClientWrapper {
  // PRIVATE INSTANCE PROPERTIES
  private readonly _ddbClient: DynamoDBClient;
  private readonly _ddbDocClient: DynamoDBDocumentClient;

  constructor({
    ddbClient,
    marshallingConfigs: { marshallOptions, unmarshallOptions } = {},
  }: DdbClientWrapperConstructorParams) {
    // `ddbClient` must be either an existing client instance, or args to instantiate a new one.
    this._ddbClient =
      ddbClient instanceof DynamoDBClient ? ddbClient : new DynamoDBClient(ddbClient ?? {});

    // Attach proc exit handler which calls destroy method
    process.on("exit", () => this._ddbClient.destroy());

    // Instantiate the doc-client
    this._ddbDocClient = DynamoDBDocumentClient.from(this._ddbClient, {
      marshallOptions: {
        convertEmptyValues: false, //       Whether to automatically convert empty strings, blobs, and sets to `null` (client default: false)
        removeUndefinedValues: true, //     Whether to remove undefined values while marshalling (client default: false)
        convertClassInstanceToMap: true, // Whether to convert typeof object to map attribute (client default: false)
        ...(marshallOptions ?? {}), //      User-provided overrides
      },
      unmarshallOptions: {
        wrapNumbers: false, //           Whether to return numbers as a string instead of converting them to native JavaScript numbers (client default: false)
        ...(unmarshallOptions ?? {}), // User-provided overrides
      },
    });
  }

  /**
   * [`GetItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
   */
  readonly getItem = async (args: GetItemInput): Promise<GetItemOutput> => {
    return await this._ddbDocClient.send(new GetCommand(args));
  };

  /**
   * [`BatchGetItem`][api-ref] command wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   */
  readonly batchGetItems = async (args: BatchGetItemsInput): Promise<BatchGetItemsOutput> => {
    const response = await this._ddbDocClient.send(new BatchGetCommand(args));
    return response as BatchGetItemsOutput;
    /* The above `as` cast is necessary because the SDK's output type for BatchGetCommand
    allows an explicit value of `undefined` for `response.UnprocessKeys[tableName].Keys`,
    which is not valid ("Keys" is a required property of the parent object), hence its
    removal from `BatchGetItemsOutput`. */
  };

  /**
   * [`PutItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   */
  readonly putItem = async (args: PutItemInput): Promise<PutItemOutput> => {
    return await this._ddbDocClient.send(new PutCommand(args));
  };

  /**
   * [`UpdateItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   */
  readonly updateItem = async (args: UpdateItemInput): Promise<UpdateItemOutput> => {
    return await this._ddbDocClient.send(new UpdateCommand(args));
  };

  /**
   * [`DeleteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   */
  readonly deleteItem = async (args: DeleteItemInput): Promise<DeleteItemOutput> => {
    return await this._ddbDocClient.send(new DeleteCommand(args));
  };

  /**
   * [`BatchWriteItem`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   */
  readonly batchWriteItems = async (args: BatchWriteItemsInput): Promise<BatchWriteItemsOutput> => {
    return await this._ddbDocClient.send(new BatchWriteCommand(args));
  };

  /**
   * [`Query`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
   */
  readonly query = async (args: QueryInput): Promise<QueryOutput> => {
    return await this._ddbDocClient.send(new QueryCommand(args));
  };

  /**
   * [`Scan`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   */
  readonly scan = async (args: ScanInput): Promise<ScanOutput> => {
    return await this._ddbDocClient.send(new ScanCommand(args));
  };

  /**
   * [`TransactWriteItems`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
   */
  readonly transactWriteItems = async (
    args: TransactWriteItemsInput
  ): Promise<TransactWriteItemsOutput> => {
    return await this._ddbDocClient.send(new TransactWriteCommand(args));
  };

  // CONTROL PLANE METHODS:

  /**
   * [`DescribeTable`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTable.html
   */
  readonly describeTable = async (args: DescribeTableInput): Promise<DescribeTableOutput> => {
    return await this._ddbClient.send(new DescribeTableCommand(args));
  };

  /**
   * [`CreateTable`][api-ref] operation wrapper.
   *
   * [api-ref]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
   */
  readonly createTable = async (args: CreateTableInput): Promise<CreateTableOutput> => {
    return await this._ddbClient.send(new CreateTableCommand(args));
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
