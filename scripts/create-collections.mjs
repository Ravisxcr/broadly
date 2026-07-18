import { MongoClient } from "mongodb";

// One-time provisioning script: explicitly creates the app's collections
// rather than relying on implicit creation on first write. Some Atlas
// custom roles only grant actions (e.g. update/insert) on collections that
// already exist in the resource catalog, so a brand-new database can 401 on
// its very first write even with a correctly-scoped readWrite role. Run this
// once against the app's normal MONGODB_URI/MONGODB_DB.
//
//   bun --env-file=.env.local scripts/create-collections.mjs

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}
if (!dbName) {
  console.error("MONGODB_DB is not set.");
  process.exit(1);
}

const COLLECTIONS = ["boards", "lists", "cards", "workspaces", "_meta"];

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));

for (const name of COLLECTIONS) {
  if (existing.has(name)) {
    console.log(`"${name}" already exists, skipping.`);
    continue;
  }
  await db.createCollection(name);
  console.log(`Created "${name}".`);
}

await client.close();
