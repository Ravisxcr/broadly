import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

// A separate MongoClient from app/lib/mongodb.ts's, since mongodbAdapter needs a
// synchronous Db instance (the driver queues operations until connect() resolves,
// so this is safe to use immediately without awaiting connect()).
let client: MongoClient;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  } else {
    client = new MongoClient(uri);
  }
} else {
  client = new MongoClient(uri);
}

const db = client.db();

// Single-document counter used to decide admin assignment atomically — MongoDB
// guarantees atomicity for operations on one document even without multi-document
// transactions (unavailable on this standalone deployment, see `transaction: false`
// below), so a $setOnInsert/$inc race on this one document is race-free while a
// plain countDocuments()-then-write is not.
const ADMIN_COUNT_ID = "adminCount";

/** Atomically claims "first admin" status: at most one caller ever gets `true`. */
async function claimFirstAdmin(): Promise<boolean> {
  const meta = db.collection<{ _id: string; count: number }>("_meta");
  const before = await meta.findOneAndUpdate(
    { _id: ADMIN_COUNT_ID },
    { $setOnInsert: { count: 1 } },
    { upsert: true, returnDocument: "before" }
  );
  // `before` is null only when this call caused the upsert's insert — i.e. no
  // adminCount document existed yet, so this is the very first admin.
  return before === null;
}

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
      // Login is OAuth-only (no password flow), so there's no unverified local
      // credential to protect against — every user's email already came from a
      // trusted provider's callback. Without this, Better Auth also requires the
      // *existing* local user's `emailVerified` to already be true before it will
      // link a new trusted provider to that account, which blocks linking Google
      // to accounts whose first-ever OAuth login (e.g. GitHub) left it false.
      requireLocalEmailVerified: false,
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
          // route, not here. `claimFirstAdmin` uses a single-document atomic
          // upsert so two concurrent first-time sign-ups can't both win.
          const isFirstAdmin = await claimFirstAdmin();
          return { data: { ...user, role: isFirstAdmin ? "admin" : "member" } };
        },
      },
    },
  },
});
