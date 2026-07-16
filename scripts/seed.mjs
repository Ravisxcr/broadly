import { MongoClient } from "mongodb";

// Run this with Bun (which auto-loads .env) or node --env-file=.env seed.mjs
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Use --env-file=.env or run with Bun.");
  process.exit(1);
}

const client = new MongoClient(uri);

const DEFAULT_ROSTER = [
  { id: "u1", initials: "AR", name: "Ari", email: "ari@studio.com", color: "#4F46E5", role: "admin" },
  { id: "u2", initials: "JS", name: "Jess", email: "jess@studio.com", color: "#EA580C", role: "member" },
  { id: "u3", initials: "KM", name: "Kim", email: "kim@studio.com", color: "#16A34A", role: "member" },
  { id: "u4", initials: "TN", name: "Tomas", email: "tomas@studio.com", color: "#9333EA", role: "member" },
];

const DEFAULT_WORKSPACES = [{ id: "w1", name: "Boardly Studio", color: "#4F46E5", memberIds: [] }];

function card(id, title, opts = {}) {
  return {
    id,
    title,
    labelIds: opts.labelIds ?? [],
    memberIds: opts.memberIds ?? [],
    due: opts.due ?? null,
    desc: opts.desc ?? "",
    checklist: opts.checklist ?? [],
    comments: opts.comments ?? [],
  };
}

function initialBoards() {
  return [
    {
      id: "b1",
      name: "Product Launch",
      cover: "#3B82F6",
      workspaceId: "w1",
      memberIds: ["u1", "u2", "u3"],
      lists: [
        {
          id: "l1",
          title: "Backlog",
          cards: [
            card("c1", "Competitive research writeup", {
              labelIds: ["l6"],
              desc: "Summarize how the top 3 competitors position their onboarding flow.",
            }),
            card("c2", "Naming brainstorm", { labelIds: ["l5"], memberIds: ["u2"] }),
          ],
        },
        {
          id: "l2",
          title: "In Progress",
          cards: [
            card("c3", "Design onboarding flow v2", {
              labelIds: ["l3", "l1"],
              memberIds: ["u1", "u3"],
              due: "Jul 18",
              checklist: [
                { text: "Wireframe empty states", done: true },
                { text: "Hi-fi screens", done: true },
                { text: "Prototype interactions", done: false },
                { text: "Review with PM", done: false },
              ],
            }),
            card("c4", "Set up analytics events", { memberIds: ["u4"], due: "Jul 20" }),
          ],
        },
        {
          id: "l3",
          title: "Review",
          cards: [
            card("c5", "Landing page copy pass", {
              labelIds: ["l2"],
              memberIds: ["u2"],
              comments: [
                { author: "Jess", initials: "JS", color: "#EA580C", time: "2d ago", text: "Left notes on the hero line, otherwise close." },
              ],
            }),
          ],
        },
        {
          id: "l4",
          title: "Done",
          cards: [
            card("c6", "Kickoff deck", { labelIds: ["l1"], memberIds: ["u1"] }),
            card("c7", "Stakeholder list finalized", {}),
          ],
        },
      ],
    },
    {
      id: "b2",
      name: "Marketing Sprint",
      cover: "#EA580C",
      workspaceId: "w1",
      memberIds: ["u1", "u2"],
      lists: [
        { id: "l1", title: "Ideas", cards: [card("c8", "Launch teaser video concept", { labelIds: ["l5"] })] },
        { id: "l2", title: "In Progress", cards: [card("c9", "Email sequence draft", { memberIds: ["u2"], due: "Jul 22" })] },
        { id: "l3", title: "Done", cards: [] },
      ],
    },
    {
      id: "b3",
      name: "Design System",
      cover: "#9333EA",
      workspaceId: "w1",
      memberIds: ["u1", "u4"],
      lists: [
        { id: "l1", title: "To Do", cards: [card("c10", "Audit color tokens", { labelIds: ["l6"] })] },
        {
          id: "l2",
          title: "Doing",
          cards: [
            card("c11", "Component spacing scale", {
              memberIds: ["u3"],
              checklist: [
                { text: "Draft scale", done: true },
                { text: "Apply to cards", done: false },
              ],
            }),
          ],
        },
        { id: "l3", title: "Done", cards: [card("c12", "Icon set v1 shipped", { labelIds: ["l1"] })] },
      ],
    },
  ];
}

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB.");

    const db = client.db();
    
    const boards = db.collection("boards");
    if ((await boards.countDocuments()) === 0) {
      await boards.insertMany(initialBoards());
      console.log("Seeded boards.");
    } else {
      console.log("Boards already exist, skipping.");
    }

    const members = db.collection("members");
    if ((await members.countDocuments()) === 0) {
      await members.insertMany(DEFAULT_ROSTER);
      console.log("Seeded members.");
    } else {
      console.log("Members already exist, skipping.");
    }

    const workspaces = db.collection("workspaces");
    if ((await workspaces.countDocuments()) === 0) {
      await workspaces.insertMany(DEFAULT_WORKSPACES);
      console.log("Seeded workspaces.");
    } else {
      console.log("Workspaces already exist, skipping.");
    }

  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await client.close();
  }
}

seed().catch(console.dir);
