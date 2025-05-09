import { mockClient } from "aws-sdk-client-mock";

/**
 * This file is used to set up Vitest for testing. It includes the following:
 * - Mocking "@aws-sdk/client-dynamodb" using `aws-sdk-client-mock`
 * - Mocking "@aws-sdk/lib-dynamodb" using `aws-sdk-client-mock`
 */

vi.mock("@aws-sdk/client-dynamodb", async (importOriginal) => {
  const {
    DynamoDBClient: ActualDynamoDBClient, // The mocked client class
    ...actualExports
  } = await importOriginal<typeof import("@aws-sdk/client-dynamodb")>();

  const DynamoDBClient = vi.fn(() => mockClient(ActualDynamoDBClient));

  return {
    DynamoDBClient,
    ...actualExports,
  };
});

vi.mock("@aws-sdk/lib-dynamodb", async (importOriginal) => {
  const {
    DynamoDBDocumentClient: ActualDynamoDBDocumentClient, // The mocked client class
    ...actualExports
  } = await importOriginal<typeof import("@aws-sdk/lib-dynamodb")>();

  const DynamoDBDocumentClient = {
    from: vi.fn(() => mockClient(ActualDynamoDBDocumentClient)),
  };

  return {
    DynamoDBDocumentClient,
    ...actualExports,
  };
});
