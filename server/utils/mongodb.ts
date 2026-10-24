import { MongoClient, type Db } from "mongodb";

// One connection for the whole app; requests that arrive while it is opening wait for the same one
let client: Promise<MongoClient> | undefined;

export async function getDb(): Promise<Db> {
  if (!client) {
    const { mongodbUri } = useRuntimeConfig();
    if (!mongodbUri) {
      throw new Error("NUXT_MONGODB_URI is not set");
    }
    client = new MongoClient(mongodbUri).connect();
    // A failed connection is tried again on the next request
    client.catch(() => {
      client = undefined;
    });
  }

  return (await client).db();
}
