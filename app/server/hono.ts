import { Hono } from "hono";
import { randomUUID } from "crypto";
import clientPromise from "@/app/lib/mongodb";
import { initialBoards, COLUMN_TEMPLATES, BOARD_COVERS, DEFAULT_ROSTER, DEFAULT_WORKSPACES, WORKSPACE_COLORS } from "@/app/lib/trello/data";
import type { BoardData, CardData, Member, WorkspaceData } from "@/app/lib/trello/types";

const app = new Hono().basePath("/api");

async function getCollection() {
  const client = await clientPromise;
  return client.db().collection<BoardData>("boards");
}

async function getMembersCollection() {
  const client = await clientPromise;
  return client.db().collection<Member>("members");
}

async function getWorkspacesCollection() {
  const client = await clientPromise;
  return client.db().collection<WorkspaceData>("workspaces");
}

async function findBoard(boardId: string): Promise<BoardData | null> {
  const collection = await getCollection();
  return collection.findOne({ id: boardId }, { projection: { _id: 0 } });
}

/** Fetches the board, applies a pure mutation, and writes the result back. */
async function updateBoard(boardId: string, mutate: (board: BoardData) => BoardData): Promise<BoardData | null> {
  const board = await findBoard(boardId);
  if (!board) return null;
  const updated = mutate(board);
  const collection = await getCollection();
  await collection.replaceOne({ id: boardId }, updated);
  return updated;
}

function emptyCard(id: string, title: string): CardData {
  return { id, title, labelIds: [], memberIds: [], due: null, desc: "", checklist: [], comments: [] };
}

app.get("/health", async (c) => {
  const client = await clientPromise;
  await client.db().command({ ping: 1 });
  return c.json({ ok: true, mongo: "connected" });
});

app.get("/boards", async (c) => {
  const collection = await getCollection();
  const count = await collection.countDocuments();
  if (count === 0) {
    await collection.insertMany(initialBoards());
  }
  await collection.updateMany({ workspaceId: { $exists: false } }, { $set: { workspaceId: DEFAULT_WORKSPACES[0].id } });
  const boards = await collection.find({}, { projection: { _id: 0 } }).toArray();
  return c.json(boards);
});

app.get("/members", async (c) => {
  const collection = await getMembersCollection();
  const count = await collection.countDocuments();
  if (count === 0) {
    await collection.insertMany(DEFAULT_ROSTER);
  }
  const members = await collection.find({}, { projection: { _id: 0 } }).toArray();
  return c.json(members);
});

app.get("/workspaces", async (c) => {
  const collection = await getWorkspacesCollection();
  const count = await collection.countDocuments();
  if (count === 0) {
    await collection.insertMany(DEFAULT_WORKSPACES);
  }
  const workspaces = await collection.find({}, { projection: { _id: 0 } }).toArray();
  return c.json(workspaces);
});

app.post("/workspaces", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  const name = body.name?.trim() || "New Workspace";
  const collection = await getWorkspacesCollection();
  const count = await collection.countDocuments();
  const workspace: WorkspaceData = { id: randomUUID(), name, color: WORKSPACE_COLORS[count % WORKSPACE_COLORS.length] };
  await collection.insertOne({ ...workspace });
  return c.json(workspace, 201);
});

app.patch("/workspaces/:workspaceId", async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  const trimmed = name?.trim();
  if (!trimmed) return c.json({ error: "name is required" }, 400);
  const workspaceId = c.req.param("workspaceId");
  const collection = await getWorkspacesCollection();
  const result = await collection.findOneAndUpdate({ id: workspaceId }, { $set: { name: trimmed } }, { returnDocument: "after", projection: { _id: 0 } });
  if (!result) return c.json({ error: "Workspace not found" }, 404);
  return c.json(result);
});

app.delete("/workspaces/:workspaceId", async (c) => {
  const workspaceId = c.req.param("workspaceId");
  const boardsCollection = await getCollection();
  const boardCount = await boardsCollection.countDocuments({ workspaceId });
  if (boardCount > 0) return c.json({ error: "Move or delete its boards first" }, 400);
  const collection = await getWorkspacesCollection();
  const result = await collection.deleteOne({ id: workspaceId });
  if (result.deletedCount === 0) return c.json({ error: "Workspace not found" }, 404);
  return c.json({ ok: true });
});

app.get("/boards/:boardId", async (c) => {
  const board = await findBoard(c.req.param("boardId"));
  if (!board) return c.json({ error: "Board not found" }, 404);
  return c.json(board);
});

app.post("/boards", async (c) => {
  const body = await c.req.json<{ name?: string; templateId?: string; memberIds?: string[]; workspaceId?: string }>();
  const name = body.name?.trim() || "New Board";
  const template = COLUMN_TEMPLATES.find((t) => t.id === body.templateId) ?? COLUMN_TEMPLATES[0];
  const collection = await getCollection();
  const count = await collection.countDocuments();
  const board: BoardData = {
    id: randomUUID(),
    name,
    cover: BOARD_COVERS[count % BOARD_COVERS.length],
    workspaceId: body.workspaceId ?? DEFAULT_WORKSPACES[0].id,
    memberIds: body.memberIds ?? [],
    lists: template.lists.map((title) => ({ id: randomUUID(), title, cards: [] })),
  };
  await collection.insertOne({ ...board });
  return c.json(board, 201);
});

app.patch("/boards/:boardId", async (c) => {
  const body = await c.req.json<Partial<Pick<BoardData, "name" | "locked" | "memberIds">>>();
  const updated = await updateBoard(c.req.param("boardId"), (board) => ({
    ...board,
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.locked !== undefined ? { locked: body.locked } : {}),
    ...(body.memberIds !== undefined ? { memberIds: body.memberIds } : {}),
  }));
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated);
});

app.delete("/boards/:boardId", async (c) => {
  const collection = await getCollection();
  const result = await collection.deleteOne({ id: c.req.param("boardId") });
  if (result.deletedCount === 0) return c.json({ error: "Board not found" }, 404);
  return c.json({ ok: true });
});

app.post("/boards/:boardId/lists", async (c) => {
  const { title } = await c.req.json<{ title?: string }>();
  const trimmed = title?.trim();
  if (!trimmed) return c.json({ error: "title is required" }, 400);
  const updated = await updateBoard(c.req.param("boardId"), (board) => ({
    ...board,
    lists: [...board.lists, { id: randomUUID(), title: trimmed, cards: [] }],
  }));
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated, 201);
});

app.patch("/boards/:boardId/lists/:listId", async (c) => {
  const { title } = await c.req.json<{ title?: string }>();
  const trimmed = title?.trim();
  if (!trimmed) return c.json({ error: "title is required" }, 400);
  const listId = c.req.param("listId");
  const updated = await updateBoard(c.req.param("boardId"), (board) => ({
    ...board,
    lists: board.lists.map((l) => (l.id !== listId ? l : { ...l, title: trimmed })),
  }));
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated);
});

app.delete("/boards/:boardId/lists/:listId", async (c) => {
  const listId = c.req.param("listId");
  const updated = await updateBoard(c.req.param("boardId"), (board) => ({
    ...board,
    lists: board.lists.filter((l) => l.id !== listId),
  }));
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated);
});

app.post("/boards/:boardId/lists/:listId/cards", async (c) => {
  const { title } = await c.req.json<{ title?: string }>();
  const trimmed = title?.trim();
  if (!trimmed) return c.json({ error: "title is required" }, 400);
  const listId = c.req.param("listId");
  const updated = await updateBoard(c.req.param("boardId"), (board) => ({
    ...board,
    lists: board.lists.map((l) => (l.id !== listId ? l : { ...l, cards: [...l.cards, emptyCard(randomUUID(), trimmed)] })),
  }));
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated, 201);
});

app.patch("/boards/:boardId/cards/:cardId", async (c) => {
  const patch = await c.req.json<Partial<Omit<CardData, "id">>>();
  const cardId = c.req.param("cardId");
  const updated = await updateBoard(c.req.param("boardId"), (board) => ({
    ...board,
    lists: board.lists.map((l) => ({
      ...l,
      cards: l.cards.map((card) => (card.id !== cardId ? card : { ...card, ...patch })),
    })),
  }));
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated);
});

app.post("/boards/:boardId/move-card", async (c) => {
  const { cardId, fromListId, toListId } = await c.req.json<{ cardId: string; fromListId: string; toListId: string }>();
  const updated = await updateBoard(c.req.param("boardId"), (board) => {
    let moved: CardData | null = null;
    const lists = board.lists.map((l) => {
      if (l.id !== fromListId) return l;
      moved = l.cards.find((card) => card.id === cardId) ?? null;
      return { ...l, cards: l.cards.filter((card) => card.id !== cardId) };
    });
    if (!moved) return board;
    return { ...board, lists: lists.map((l) => (l.id === toListId ? { ...l, cards: [...l.cards, moved as CardData] } : l)) };
  });
  if (!updated) return c.json({ error: "Board not found" }, 404);
  return c.json(updated);
});

export default app;
