import { MongoClient } from "mongodb";
import crypto from "crypto";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Use --env-file=.env or run with Bun.");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB;
if (!dbName) {
  console.error("MONGODB_DB is not set. Use --env-file=.env or run with Bun.");
  process.exit(1);
}

const client = new MongoClient(uri);

// These ids match app/lib/trello/data.ts's DEFAULT_ROSTER — kept in sync so seeded
// board/card memberIds resolve to the right name/avatar in the (frontend-only) demo
// roster. They intentionally don't correspond to any real Better Auth `user` document;
// membership here is decorative demo data, not an account you can sign in as.
const u1 = "f7b5392d-948a-4467-872e-33306b3a0110"; // Ari
const u2 = "a94025a1-7785-4089-a226-e414c5b3ab3b"; // Jess
const u3 = "84e8574e-6e4f-4d94-b152-32b0051e5e01"; // Kim
const u4 = "37a54917-8e67-42f5-b28e-324c08470a6c"; // Tomas
const w1 = "d40a2bb8-c6bc-4bc9-a9c1-7cb4ff495147";

const DEFAULT_WORKSPACES = [{ id: w1, name: "Boardly Studio", color: "#4F46E5", memberIds: [] }];

const randomId = () => crypto.randomUUID();

const boardsToInsert = [];
const listsToInsert = [];
const cardsToInsert = [];

function generateBoardData() {
  const board1 = { id: randomId(), name: "Product Launch", cover: "#3B82F6", workspaceId: w1, memberIds: [u1, u2, u3], listIds: [], locked: false };
  const board1_list1 = { id: randomId(), boardId: board1.id, title: "Backlog", cardIds: [] };
  const board1_list2 = { id: randomId(), boardId: board1.id, title: "In Progress", cardIds: [] };
  const board1_list3 = { id: randomId(), boardId: board1.id, title: "Review", cardIds: [] };
  const board1_list4 = { id: randomId(), boardId: board1.id, title: "Done", cardIds: [] };
  board1.listIds.push(board1_list1.id, board1_list2.id, board1_list3.id, board1_list4.id);

  const addCard = (list, cardData) => {
    const cardId = cardData.id || randomId();
    list.cardIds.push(cardId);
    cardsToInsert.push({
      id: cardId,
      boardId: list.boardId,
      listId: list.id,
      title: cardData.title,
      labelIds: cardData.labelIds || [],
      memberIds: cardData.memberIds || [],
      due: cardData.due || null,
      desc: cardData.desc || "",
      checklist: cardData.checklist || [],
      comments: cardData.comments || []
    });
  };

  addCard(board1_list1, { title: "Competitive research writeup", labelIds: ["l6"], desc: "Summarize how the top 3 competitors position their onboarding flow." });
  addCard(board1_list1, { title: "Naming brainstorm", labelIds: ["l5"], memberIds: [u2] });
  addCard(board1_list2, { title: "Design onboarding flow v2", labelIds: ["l3", "l1"], memberIds: [u1, u3], due: "Jul 18", checklist: [{ text: "Wireframe empty states", done: true }, { text: "Hi-fi screens", done: true }, { text: "Prototype interactions", done: false }, { text: "Review with PM", done: false }] });
  addCard(board1_list2, { title: "Set up analytics events", memberIds: [u4], due: "Jul 20" });
  addCard(board1_list3, { title: "Landing page copy pass", labelIds: ["l2"], memberIds: [u2], comments: [{ author: "Jess", initials: "JS", color: "#EA580C", time: "2d ago", text: "Left notes on the hero line, otherwise close." }] });
  addCard(board1_list4, { title: "Kickoff deck", labelIds: ["l1"], memberIds: [u1] });
  addCard(board1_list4, { title: "Stakeholder list finalized" });

  const board2 = { id: randomId(), name: "Marketing Sprint", cover: "#EA580C", workspaceId: w1, memberIds: [u1, u2], listIds: [], locked: false };
  const board2_list1 = { id: randomId(), boardId: board2.id, title: "Ideas", cardIds: [] };
  const board2_list2 = { id: randomId(), boardId: board2.id, title: "In Progress", cardIds: [] };
  const board2_list3 = { id: randomId(), boardId: board2.id, title: "Done", cardIds: [] };
  board2.listIds.push(board2_list1.id, board2_list2.id, board2_list3.id);

  addCard(board2_list1, { title: "Launch teaser video concept", labelIds: ["l5"] });
  addCard(board2_list2, { title: "Email sequence draft", memberIds: [u2], due: "Jul 22" });

  const board3 = { id: randomId(), name: "Design System", cover: "#9333EA", workspaceId: w1, memberIds: [u1, u4], listIds: [], locked: false };
  const board3_list1 = { id: randomId(), boardId: board3.id, title: "To Do", cardIds: [] };
  const board3_list2 = { id: randomId(), boardId: board3.id, title: "Doing", cardIds: [] };
  const board3_list3 = { id: randomId(), boardId: board3.id, title: "Done", cardIds: [] };
  board3.listIds.push(board3_list1.id, board3_list2.id, board3_list3.id);
  
  addCard(board3_list1, { title: "Audit color tokens", labelIds: ["l6"] });
  addCard(board3_list2, { title: "Component spacing scale", memberIds: [u3], checklist: [{ text: "Draft scale", done: true }, { text: "Apply to cards", done: false }] });
  addCard(board3_list3, { title: "Icon set v1 shipped", labelIds: ["l1"] });

  const board4 = { id: randomId(), name: "Engineering Roadmap", cover: "#16A34A", workspaceId: w1, memberIds: [u1, u2, u3, u4], listIds: [], locked: false };
  const board4_list1 = { id: randomId(), boardId: board4.id, title: "Q3 Planning", cardIds: [] };
  const board4_list2 = { id: randomId(), boardId: board4.id, title: "Sprint 1", cardIds: [] };
  const board4_list3 = { id: randomId(), boardId: board4.id, title: "Sprint 2", cardIds: [] };
  const board4_list4 = { id: randomId(), boardId: board4.id, title: "Backlog", cardIds: [] };
  board4.listIds.push(board4_list1.id, board4_list2.id, board4_list3.id, board4_list4.id);

  addCard(board4_list1, { title: "Define sprint goals", labelIds: ["l3"], memberIds: [u1, u2] });
  addCard(board4_list1, { title: "Capacity planning", memberIds: [u3] });
  addCard(board4_list2, { title: "Implement new authentication flow", labelIds: ["l4"], memberIds: [u2], due: "Aug 15" });
  addCard(board4_list2, { title: "Fix flaky E2E tests", labelIds: ["l4"], memberIds: [u3, u4] });
  addCard(board4_list2, { title: "Upgrade React version", memberIds: [u1] });
  addCard(board4_list3, { title: "Migrate database to cluster", labelIds: ["l2", "l4"], memberIds: [u4], desc: "Need to provision larger cluster before end of month." });
  addCard(board4_list3, { title: "Setup read replicas", labelIds: ["l2"] });
  addCard(board4_list4, { title: "Explore Next.js app router", labelIds: ["l5"] });
  
  for (let i = 1; i <= 20; i++) {
     addCard(board4_list4, { title: `Tech debt item #${i}` });
  }

  boardsToInsert.push(board1, board2, board3, board4);
  listsToInsert.push(
    board1_list1, board1_list2, board1_list3, board1_list4,
    board2_list1, board2_list2, board2_list3,
    board3_list1, board3_list2, board3_list3,
    board4_list1, board4_list2, board4_list3, board4_list4
  );
}

generateBoardData();

const FORCE = process.argv.includes("--force") || process.argv.includes("--reset");

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB.");

    const db = client.db(dbName);

    const existingBoards = await db.collection("boards").countDocuments();
    if (existingBoards > 0 && !FORCE) {
      console.log(
        `Found ${existingBoards} existing board(s) — refusing to drop and reseed without --force. ` +
          `Re-run as \`node scripts/seed.mjs --force\` if you really want to replace them.`
      );
      return;
    }

    console.log("Dropping existing collections...");
    await db.collection("boards").drop().catch(() => {});
    await db.collection("lists").drop().catch(() => {});
    await db.collection("cards").drop().catch(() => {});
    await db.collection("workspaces").drop().catch(() => {});
    // Deliberately not touching "user" — it's Better Auth's real account
    // collection (real OAuth sign-ins, admin/member roles), not demo data.

    console.log("Seeding fresh data...");

    const boards = db.collection("boards");
    await boards.insertMany(boardsToInsert);
    console.log(`Seeded ${boardsToInsert.length} boards.`);

    const lists = db.collection("lists");
    await lists.insertMany(listsToInsert);
    console.log(`Seeded ${listsToInsert.length} lists.`);

    const cards = db.collection("cards");
    await cards.insertMany(cardsToInsert);
    console.log(`Seeded ${cardsToInsert.length} cards.`);

    const workspaces = db.collection("workspaces");
    await workspaces.insertMany(DEFAULT_WORKSPACES);
    console.log("Seeded workspaces.");

  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await client.close();
  }
}

seed().catch(console.dir);
