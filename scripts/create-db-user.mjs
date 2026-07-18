import { MongoClient } from "mongodb";

// One-time provisioning script for local/self-hosted MongoDB: creates the
// least-privilege user the app should actually run as (readWrite on exactly
// one database, no admin rights). Run this once against an *admin*
// connection, then switch the app's real MONGODB_URI/MONGODB_DB over to the
// scoped user and database it creates.
//
//   MONGODB_URI="mongodb://root:changeme@127.0.0.1:27017/admin?authSource=admin" \
//   APP_DB_NAME=app APP_DB_USER=boardly_app APP_DB_PASSWORD=changeme \
//   bun scripts/create-db-user.mjs
//
// Not applicable to Atlas: Atlas has no exposed root/admin superuser to
// connect as here — provision the scoped user instead via Atlas's Database
// Access UI, granting a role scoped to one database (e.g. "readWrite@app").

const adminUri = process.env.MONGODB_URI;
if (!adminUri) {
  console.error("MONGODB_URI is not set. Point it at an admin connection to run this script.");
  process.exit(1);
}

const appDbName = process.env.APP_DB_NAME;
const appUser = process.env.APP_DB_USER;
const appPassword = process.env.APP_DB_PASSWORD;
if (!appDbName || !appUser || !appPassword) {
  console.error("Set APP_DB_NAME, APP_DB_USER, and APP_DB_PASSWORD.");
  process.exit(1);
}

const client = new MongoClient(adminUri);
await client.connect();

// Creating the user on appDbName (rather than admin) means it authenticates
// with authSource=<appDbName>, and the readWrite role is scoped to that one
// database — it has no visibility into or access to any other database.
await client.db(appDbName).command({
  createUser: appUser,
  pwd: appPassword,
  roles: [{ role: "readWrite", db: appDbName }],
});

console.log(`Created user "${appUser}" with readWrite on "${appDbName}" only.`);
console.log(
  `Update MONGODB_URI to: mongodb://${appUser}:<password>@<host>:27017/?authSource=${appDbName}&retryWrites=false\n` +
  `Update MONGODB_DB to: ${appDbName}`
);

await client.close();
