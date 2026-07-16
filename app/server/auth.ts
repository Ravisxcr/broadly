import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import clientPromise from "@/app/lib/mongodb";

// Since Better Auth needs the DB instance synchronously or through a function,
// we can await the clientPromise in a top-level await (if supported) or 
// use a promise for the db. Wait, mongodbAdapter expects the db instance directly.
// But betterAuth itself can be async or synchronous. Wait, `mongodbAdapter` expects a Db instance or a Promise<Db> in newer versions?
// Let's create a client wrapper or just get the client.

// To avoid top-level await issues, we can just pass the db promise if supported, 
// or since MongoClient allows creating a db without waiting for connect, we can do this:
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

// Create a new client instance for auth if we don't want to use the promise wrapper, 
// or we can reuse the global one.
let client: MongoClient;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  } else {
    client = new MongoClient(uri); // fallback
  }
} else {
  client = new MongoClient(uri);
}

// We can just use a synchronous DB instance, MongoDB driver handles queuing until connected.
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: process.env.MICROSOFT_TENANT_ID as string | undefined, // optional
    },
  },
});
