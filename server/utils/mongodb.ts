import { MongoClient, type Db } from "mongodb";

let client: MongoClient | undefined;

export async function getDb(): Promise<Db> {
  if (!client) {
    const { mongodbUri } = useRuntimeConfig();
    if (!mongodbUri) {
      throw new Error("NUXT_MONGODB_URI is not set");
    }
    const newClient = new MongoClient(mongodbUri);
    await newClient.connect();
    client = newClient;
  }

  return client.db();
}
