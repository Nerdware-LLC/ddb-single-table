import { ItemInputError } from "../utils/errors.js";
import type { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const clients = new Map<DynamoDBClient, number>();

const destroyClients = () => {
  for (const client of clients.keys()) client.destroy();
};

/**
 * One process listener, with explicit ownership for clients shared by multiple tables.
 */
export const registerClient = (client: DynamoDBClient) => {
  if (clients.size === 0) process.once("exit", destroyClients);

  clients.set(client, (clients.get(client) ?? 0) + 1);

  let disposed = false;
  return (destroy: boolean) => {
    if (disposed) return;
    const references = clients.get(client)!;

    if (destroy && references > 1)
      throw new ItemInputError("Cannot destroy a client still used by another table.");

    disposed = true;

    if (references === 1) clients.delete(client);
    else clients.set(client, references - 1);
    if (!clients.size) process.removeListener("exit", destroyClients);
    if (destroy) client.destroy();
  };
};
