import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

// Read explicitly rather than relying on a path segment in MONGODB_URI:
// Atlas-style mongodb+srv:// URIs (e.g. ".../?appName=Cluster0") carry no
// database name, so `client.db()` with no argument would throw.
export const dbName = process.env.MONGODB_DB;
if (!dbName) throw new Error("MONGODB_DB is not set");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
