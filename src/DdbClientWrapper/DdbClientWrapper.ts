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
  DescribeTableInput,
  DescribeTableOutput,
  CreateTableInput,
  CreateTableOutput,
  ListTablesInput,
  ListTablesOutput,
} from "./types";

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
      ddbClient instanceof DynamoDBClient ? ddbClient : new DynamoDBClient(ddbClient);

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
   * [`GetItem`][ddb-docs-get-item] operation wrapper.
   *
   * [ddb-docs-get-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
   */
  readonly getItem = async (args: GetItemInput): Promise<GetItemOutput> => {
    return await this._ddbDocClient.send(new GetCommand(args));
  };

  /**
   * [`BatchGetItem`][ddb-docs-batch-get] command wrapper.
   *
   * [ddb-docs-batch-get]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
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
   * [`PutItem`][ddb-docs-put-item] operation wrapper.
   *
   * [ddb-docs-put-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
   */
  readonly putItem = async (args: PutItemInput): Promise<PutItemOutput> => {
    return await this._ddbDocClient.send(new PutCommand(args));
  };

  /**
   * [`UpdateItem`][ddb-docs-update-item] operation wrapper.
   *
   * [ddb-docs-update-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
   */
  readonly updateItem = async (args: UpdateItemInput): Promise<UpdateItemOutput> => {
    return await this._ddbDocClient.send(new UpdateCommand(args));
  };

  /**
   * [`DeleteItem`][ddb-docs-del-item] operation wrapper.
   *
   * [ddb-docs-del-item]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html
   */
  readonly deleteItem = async (args: DeleteItemInput): Promise<DeleteItemOutput> => {
    return await this._ddbDocClient.send(new DeleteCommand(args));
  };

  /**
   * [`BatchWriteItem`][ddb-docs-batch-write] operation wrapper.
   *
   * [ddb-docs-batch-write]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   */
  readonly batchWriteItems = async (args: BatchWriteItemsInput): Promise<BatchWriteItemsOutput> => {
    return await this._ddbDocClient.send(new BatchWriteCommand(args));
  };

  /**
   * [`Query`][ddb-docs-query] operation wrapper.
   *
   * [ddb-docs-query]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
   */
  readonly query = async (args: QueryInput): Promise<QueryOutput> => {
    return await this._ddbDocClient.send(new QueryCommand(args));
  };

  /**
   * [`Scan`][ddb-docs-scan] operation wrapper.
   *
   * [ddb-docs-scan]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
   */
  readonly scan = async (args: ScanInput): Promise<ScanOutput> => {
    return await this._ddbDocClient.send(new ScanCommand(args));
  };

  // CONTROL PLANE METHODS:

  /**
   * [`DescribeTable`][ddb-docs-describe-table] operation wrapper.
   *
   * [ddb-docs-describe-table]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTable.html
   */
  readonly describeTable = async (args: DescribeTableInput): Promise<DescribeTableOutput> => {
    return await this._ddbClient.send(new DescribeTableCommand(args));
  };

  /**
   * [`CreateTable`][ddb-docs-create-table] operation wrapper.
   *
   * [ddb-docs-create-table]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
   */
  readonly createTable = async (args: CreateTableInput): Promise<CreateTableOutput> => {
    return await this._ddbClient.send(new CreateTableCommand(args));
  };

  /**
   * [`ListTables`][ddb-docs-list-tables] operation wrapper.
   *
   * [ddb-docs-list-tables]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListTables.html
   */
  readonly listTables = async (args: ListTablesInput = {}): Promise<ListTablesOutput> => {
    return await this._ddbClient.send(new ListTablesCommand(args));
  };
}
