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

// A provider with no client id can't authenticate against anything, so it's left
// out of `socialProviders` entirely rather than registered with an empty clientId.
const socialProviders: NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  socialProviders.microsoft = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID, // optional
  };
}

export const enabledSocialProviders = Object.keys(socialProviders) as Array<keyof typeof socialProviders>;

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,
    transaction: false,
  }),
  socialProviders,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: enabledSocialProviders,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        // Never client-supplied — assigned server-side by the create hook below,
        // or changed later via the admin-only PATCH /api/members/:userId/role.
        input: false,
        defaultValue: "member",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // The very first account ever created becomes the sole admin;
          // everyone after that defaults to member. There is always exactly
          // one admin — later transfers happen atomically in the role-update
          // route, not here.
          const userCount = await db.collection("user").countDocuments();
          return { data: { ...user, role: userCount === 0 ? "admin" : "member" } };
        },
      },
    },
  },
});
