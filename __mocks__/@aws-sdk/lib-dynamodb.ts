import { mockClient } from "aws-sdk-client-mock";
import { MOCK_ITEMS } from "../../src/tests/staticMockItems";
import type {
  GetCommandInput,
  GetCommandOutput,
  BatchGetCommandInput,
  BatchGetCommandOutput,
  PutCommandInput,
  PutCommandOutput,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  UpdateCommandInput,
  UpdateCommandOutput,
  DeleteCommandInput,
  DeleteCommandOutput,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const {
  DynamoDBDocumentClient: _DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
  PutCommand,
  BatchWriteCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = await vi.importActual<typeof import("@aws-sdk/lib-dynamodb")>("@aws-sdk/lib-dynamodb");

/** Thin wrapper to provide better type inference for our fake DDB command fns. */
const fakeDdbCommandFn = <CmdInput, CmdOutput>(
  fn: (args: RequireNecessaryKeys<CmdInput>) => Omit<CmdOutput, "$metadata">
) => fn;

const DynamoDBDocumentClient = {
  from: vi.fn(() =>
    mockClient(_DynamoDBDocumentClient)
      .on(GetCommand)
      .callsFake(
        fakeDdbCommandFn<GetCommandInput, GetCommandOutput>(() => {
          return {
            Item: MOCK_ITEMS.ITEM_A,
          };
        })
      )
      .on(BatchGetCommand)
      .callsFake(
        fakeDdbCommandFn<BatchGetCommandInput, BatchGetCommandOutput>(({ RequestItems }) => {
          const [tableName] = Object.entries(RequestItems)[0];
          return {
            Responses: {
              [tableName]: Object.values(MOCK_ITEMS),
            },
          };
        })
      )
      .on(PutCommand)
      .callsFake(
        fakeDdbCommandFn<PutCommandInput, PutCommandOutput>(({ Item: { pk, sk, ...item } }) => {
          return {
            Attributes: {
              ...MOCK_ITEMS.ITEM_A,
              ...item,
            },
          };
        })
      )
      .on(BatchWriteCommand)
      .callsFake(
        fakeDdbCommandFn<BatchWriteCommandInput, BatchWriteCommandOutput>(() => {
          // BatchWrite doesn't return items/attributes unless they're "unprocessed".
          return {};
        })
      )
      .on(UpdateCommand)
      .callsFake(
        fakeDdbCommandFn<UpdateCommandInput, UpdateCommandOutput>(() => {
          console.error("UpdateCommand must be mocked individually.");
          return {
            Attributes: {},
          };
        })
      )
      .on(DeleteCommand)
      .callsFake(
        fakeDdbCommandFn<DeleteCommandInput, DeleteCommandOutput>(({ Key }) => {
          return {
            Attributes: MOCK_ITEMS.ITEM_A,
          };
        })
      )
      .on(QueryCommand)
      .callsFake(
        fakeDdbCommandFn<QueryCommandInput, QueryCommandOutput>(() => {
          console.warn("QueryCommand must be mocked individually.");
          return {
            Items: [],
          };
        })
      )
      .on(ScanCommand)
      .callsFake(
        fakeDdbCommandFn<ScanCommandInput, ScanCommandOutput>(() => {
          return {
            Items: Object.values(MOCK_ITEMS),
          };
        })
      )
  ),
};

export {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
  PutCommand,
  BatchWriteCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
};

/** Modifies DDB-cmd input types for mocking purposes. */
type RequireNecessaryKeys<T> = Omit<T, "ExpressionAttributeValues"> & {
  [K in keyof T as K extends
    | "Key"
    | "Item"
    | "RequestItems"
    | "UpdateExpression"
    | "KeyConditionExpression"
    ? K
    : never]-?: Exclude<T[K], undefined>;
} & {
  ExpressionAttributeValues?: Record<string, string>;
};
