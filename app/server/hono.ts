import { Hono } from "hono";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";
import { COLUMN_TEMPLATES, BOARD_COVERS, DEFAULT_ROSTER, DEFAULT_WORKSPACES, WORKSPACE_COLORS } from "@/app/lib/trello/data";
import type { AuthUser, BoardData, CardData, WorkspaceData, BoardDoc, ListDoc, CardDoc } from "@/app/lib/trello/types";
import { auth, enabledSocialProviders } from "@/app/server/auth";

// better-auth's mongo adapter stores the user id as the Mongo `_id` (an ObjectId) and
interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  image?: string | null;
}

const app = new Hono().basePath("/api");

app.on(["POST", "GET"], "/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/auth-providers", (c) => {
  return c.json({ providers: enabledSocialProviders });
});

async function getBoardsCollection() {
  const client = await clientPromise;
  return client.db().collection<BoardDoc>("boards");
}

async function getListsCollection() {
  const client = await clientPromise;
  return client.db().collection<ListDoc>("lists");
}

async function getCardsCollection() {
  const client = await clientPromise;
  return client.db().collection<CardDoc>("cards");
}

async function getUsersCollection() {
  const client = await clientPromise;
  return client.db().collection<UserDoc>("user");
}

async function getWorkspacesCollection() {
  const client = await clientPromise;
  return client.db().collection<WorkspaceData>("workspaces");
}

async function getBoardData(boardId: string): Promise<BoardData | null> {
  const boardsCol = await getBoardsCollection();
  const boardDoc = await boardsCol.findOne({ id: boardId }, { projection: { _id: 0 } });
  if (!boardDoc) return null;

  const listsCol = await getListsCollection();
  const cardsCol = await getCardsCollection();

  const listDocs = await listsCol.find({ boardId }, { projection: { _id: 0 } }).toArray();
  const cardDocs = await cardsCol.find({ boardId }, { projection: { _id: 0 } }).toArray();

  const lists: BoardData["lists"] = boardDoc.listIds.map((listId) => {
    const listDoc = listDocs.find((l) => l.id === listId);
    if (!listDoc) return { id: listId, title: "Unknown", cards: [] };

    const cards = listDoc.cardIds
      .map((cardId) => {
        const cardDoc = cardDocs.find((c) => c.id === cardId);
        if (!cardDoc) return null;
        const { boardId: _, listId: __, ...cardData } = cardDoc;
        return cardData as CardData;
      })
      .filter((c) => c !== null);

    return {
      id: listDoc.id,
      title: listDoc.title,
      cards,
    };
  });

  return {
    id: boardDoc.id,
    name: boardDoc.name,
    cover: boardDoc.cover,
    memberIds: boardDoc.memberIds,
    locked: boardDoc.locked,
    workspaceId: boardDoc.workspaceId,
    lists,
  };
}

function emptyCard(id: string, boardId: string, listId: string, title: string): CardDoc {
  return { id, boardId, listId, title, labelIds: [], memberIds: [], due: null, desc: "", checklist: [], comments: [] };
}

app.get("/health", async (c) => {
  const client = await clientPromise;
  await client.db().command({ ping: 1 });
  return c.json({ ok: true, mongo: "connected" });
});

app.get("/boards", async (c) => {
  const boardsCol = await getBoardsCollection();
  // Ensure workspaceId for backward compatibility
  await boardsCol.updateMany({ workspaceId: { $exists: false } }, { $set: { workspaceId: DEFAULT_WORKSPACES[0].id } });
  const boardDocs = await boardsCol.find({}, { projection: { _id: 0 } }).toArray();

  const listsCol = await getListsCollection();
  const cardsCol = await getCardsCollection();
  const [listDocs, cardDocs] = await Promise.all([
    listsCol.find({}, { projection: { _id: 0 } }).toArray(),
    cardsCol.find({}, { projection: { _id: 0 } }).toArray(),
  ]);

  const boards: BoardData[] = boardDocs.map((boardDoc) => {
    const lists: BoardData["lists"] = boardDoc.listIds.map((listId) => {
      const listDoc = listDocs.find((l) => l.id === listId);
      if (!listDoc) return { id: listId, title: "Unknown", cards: [] };

      const cards = listDoc.cardIds
        .map((cardId) => {
          const cardDoc = cardDocs.find((cd) => cd.id === cardId);
          if (!cardDoc) return null;
          const { boardId: _boardId, listId: _listId, ...cardData } = cardDoc;
          return cardData as CardData;
        })
        .filter((cd): cd is CardData => cd !== null);

      return { id: listDoc.id, title: listDoc.title, cards };
    });

    return {
      id: boardDoc.id,
      name: boardDoc.name,
      cover: boardDoc.cover,
      memberIds: boardDoc.memberIds,
      locked: boardDoc.locked,
      workspaceId: boardDoc.workspaceId,
      lists,
    };
  });

  return c.json(boards);
});

app.get("/members", async (c) => {
  const collection = await getUsersCollection();
  const users = await collection.find({}, { projection: { name: 1, email: 1, image: 1 } }).toArray();
  const authUsers: AuthUser[] = users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, image: u.image ?? null }));
  return c.json(authUsers);
});

app.get("/workspaces", async (c) => {
  const collection = await getWorkspacesCollection();
  await collection.updateMany({ memberIds: { $exists: false } }, { $set: { memberIds: [] } });
  const workspaces = await collection.find({}, { projection: { _id: 0 } }).toArray();
  return c.json(workspaces);
});

app.post("/workspaces", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  const name = body.name?.trim() || "New Workspace";
  const collection = await getWorkspacesCollection();
  const count = await collection.countDocuments();
  const workspace: WorkspaceData = { id: randomUUID(), name, color: WORKSPACE_COLORS[count % WORKSPACE_COLORS.length], memberIds: [] };
  await collection.insertOne({ ...workspace });
  return c.json(workspace, 201);
});

app.patch("/workspaces/:workspaceId", async (c) => {
  const body = await c.req.json<Partial<Pick<WorkspaceData, "name" | "memberIds">>>();
  const set: Partial<Pick<WorkspaceData, "name" | "memberIds">> = {};
  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed) return c.json({ error: "name is required" }, 400);
    set.name = trimmed;
  }
  if (body.memberIds !== undefined) set.memberIds = body.memberIds;
  if (Object.keys(set).length === 0) return c.json({ error: "Nothing to update" }, 400);
  const workspaceId = c.req.param("workspaceId");
  const collection = await getWorkspacesCollection();
  const result = await collection.findOneAndUpdate({ id: workspaceId }, { $set: set }, { returnDocument: "after", projection: { _id: 0 } });
  if (!result) return c.json({ error: "Workspace not found" }, 404);
  return c.json(result);
});

app.delete("/workspaces/:workspaceId", async (c) => {
  const workspaceId = c.req.param("workspaceId");
  const boardsCollection = await getBoardsCollection();
  const boardCount = await boardsCollection.countDocuments({ workspaceId });
  if (boardCount > 0) return c.json({ error: "Move or delete its boards first" }, 400);
  const collection = await getWorkspacesCollection();
  const result = await collection.deleteOne({ id: workspaceId });
  if (result.deletedCount === 0) return c.json({ error: "Workspace not found" }, 404);
  return c.json({ ok: true });
});

app.get("/boards/:boardId", async (c) => {
  const board = await getBoardData(c.req.param("boardId"));
  if (!board) return c.json({ error: "Board not found" }, 404);
  return c.json(board);
});

app.post("/boards", async (c) => {
  const body = await c.req.json<{ name?: string; templateId?: string; memberIds?: string[]; workspaceId?: string }>();
  const name = body.name?.trim() || "New Board";
  const template = COLUMN_TEMPLATES.find((t) => t.id === body.templateId) ?? COLUMN_TEMPLATES[0];
  const boardsCol = await getBoardsCollection();
  const count = await boardsCol.countDocuments();
  const boardId = randomUUID();
  
  const boardDoc: BoardDoc = {
    id: boardId,
    name,
    cover: BOARD_COVERS[count % BOARD_COVERS.length],
    workspaceId: body.workspaceId ?? DEFAULT_WORKSPACES[0].id,
    memberIds: body.memberIds ?? [],
    listIds: [],
  };

  const lists: ListDoc[] = [];
  template.lists.forEach((title) => {
    const listId = randomUUID();
    boardDoc.listIds.push(listId);
    lists.push({ id: listId, boardId, title, cardIds: [] });
  });

  await boardsCol.insertOne({ ...boardDoc });
  if (lists.length > 0) {
    const listsCol = await getListsCollection();
    await listsCol.insertMany(lists);
  }

  const boardData = await getBoardData(boardId);
  return c.json(boardData, 201);
});

app.patch("/boards/:boardId", async (c) => {
  const body = await c.req.json<Partial<Pick<BoardDoc, "name" | "locked" | "memberIds">>>();
  const boardsCol = await getBoardsCollection();
  const set: Partial<BoardDoc> = {};
  if (body.name !== undefined) set.name = body.name;
  if (body.locked !== undefined) set.locked = body.locked;
  if (body.memberIds !== undefined) set.memberIds = body.memberIds;
  
  const result = await boardsCol.findOneAndUpdate(
    { id: c.req.param("boardId") },
    { $set: set },
    { returnDocument: "after", projection: { _id: 0 } }
  );
  if (!result) return c.json({ error: "Board not found" }, 404);
  const boardData = await getBoardData(c.req.param("boardId"));
  return c.json(boardData);
});

app.delete("/boards/:boardId", async (c) => {
  const boardId = c.req.param("boardId");
  const boardsCol = await getBoardsCollection();
  const listsCol = await getListsCollection();
  const cardsCol = await getCardsCollection();

  const result = await boardsCol.deleteOne({ id: boardId });
  if (result.deletedCount === 0) return c.json({ error: "Board not found" }, 404);

  await listsCol.deleteMany({ boardId });
  await cardsCol.deleteMany({ boardId });

  return c.json({ ok: true });
});

app.post("/boards/:boardId/lists", async (c) => {
  const { title } = await c.req.json<{ title?: string }>();
  const trimmed = title?.trim();
  if (!trimmed) return c.json({ error: "title is required" }, 400);
  
  const boardId = c.req.param("boardId");
  const listId = randomUUID();
  const listDoc: ListDoc = { id: listId, boardId, title: trimmed, cardIds: [] };
  
  const listsCol = await getListsCollection();
  await listsCol.insertOne(listDoc);
  
  const boardsCol = await getBoardsCollection();
  await boardsCol.updateOne({ id: boardId }, { $push: { listIds: listId } });
  
  const updated = await getBoardData(boardId);
  return c.json(updated, 201);
});

app.patch("/boards/:boardId/lists/:listId", async (c) => {
  const { title } = await c.req.json<{ title?: string }>();
  const trimmed = title?.trim();
  if (!trimmed) return c.json({ error: "title is required" }, 400);
  
  const listId = c.req.param("listId");
  const listsCol = await getListsCollection();
  const result = await listsCol.updateOne({ id: listId, boardId: c.req.param("boardId") }, { $set: { title: trimmed } });
  if (result.matchedCount === 0) return c.json({ error: "List not found" }, 404);
  
  const updated = await getBoardData(c.req.param("boardId"));
  return c.json(updated);
});

app.delete("/boards/:boardId/lists/:listId", async (c) => {
  const boardId = c.req.param("boardId");
  const listId = c.req.param("listId");
  
  const boardsCol = await getBoardsCollection();
  await boardsCol.updateOne({ id: boardId }, { $pull: { listIds: listId } });
  
  const listsCol = await getListsCollection();
  await listsCol.deleteOne({ id: listId, boardId });
  
  const cardsCol = await getCardsCollection();
  await cardsCol.deleteMany({ listId, boardId });
  
  const updated = await getBoardData(boardId);
  return c.json(updated);
});

app.post("/boards/:boardId/lists/:listId/cards", async (c) => {
  const { title } = await c.req.json<{ title?: string }>();
  const trimmed = title?.trim();
  if (!trimmed) return c.json({ error: "title is required" }, 400);
  
  const boardId = c.req.param("boardId");
  const listId = c.req.param("listId");
  const cardId = randomUUID();
  
  const cardDoc = emptyCard(cardId, boardId, listId, trimmed);
  const cardsCol = await getCardsCollection();
  await cardsCol.insertOne(cardDoc);
  
  const listsCol = await getListsCollection();
  await listsCol.updateOne({ id: listId, boardId }, { $push: { cardIds: cardId } });
  
  const updated = await getBoardData(boardId);
  return c.json(updated, 201);
});

app.patch("/boards/:boardId/cards/:cardId", async (c) => {
  const patch = await c.req.json<Partial<Omit<CardDoc, "id" | "boardId" | "listId">>>();
  const boardId = c.req.param("boardId");
  const cardId = c.req.param("cardId");
  
  const cardsCol = await getCardsCollection();
  const result = await cardsCol.updateOne({ id: cardId, boardId }, { $set: patch });
  if (result.matchedCount === 0) return c.json({ error: "Card not found" }, 404);
  
  const updated = await getBoardData(boardId);
  return c.json(updated);
});

app.delete("/boards/:boardId/cards/:cardId", async (c) => {
  const boardId = c.req.param("boardId");
  const cardId = c.req.param("cardId");

  const listsCol = await getListsCollection();
  await listsCol.updateOne({ boardId, cardIds: cardId }, { $pull: { cardIds: cardId } });

  const cardsCol = await getCardsCollection();
  const result = await cardsCol.deleteOne({ id: cardId, boardId });
  if (result.deletedCount === 0) return c.json({ error: "Card not found" }, 404);

  const updated = await getBoardData(boardId);
  return c.json(updated);
});

app.post("/boards/:boardId/move-card", async (c) => {
  const { cardId, fromListId, toListId } = await c.req.json<{ cardId: string; fromListId: string; toListId: string }>();
  const boardId = c.req.param("boardId");
  
  const listsCol = await getListsCollection();
  // Remove from source list
  await listsCol.updateOne({ id: fromListId, boardId }, { $pull: { cardIds: cardId } });
  // Add to dest list
  await listsCol.updateOne({ id: toListId, boardId }, { $push: { cardIds: cardId } });
  
  const cardsCol = await getCardsCollection();
  await cardsCol.updateOne({ id: cardId, boardId }, { $set: { listId: toListId } });
  
  const updated = await getBoardData(boardId);
  return c.json(updated);
});

export default app;
