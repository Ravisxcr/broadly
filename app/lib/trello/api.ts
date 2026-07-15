import type { BoardData, CardData, Member, WorkspaceData } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchBoards(): Promise<BoardData[]> {
  return request<BoardData[]>("/api/boards");
}

export function fetchMembers(): Promise<Member[]> {
  return request<Member[]>("/api/members");
}

export function createBoard(input: { name: string; templateId: string; memberIds: string[]; workspaceId: string }): Promise<BoardData> {
  return request<BoardData>("/api/boards", { method: "POST", body: JSON.stringify(input) });
}

export function fetchWorkspaces(): Promise<WorkspaceData[]> {
  return request<WorkspaceData[]>("/api/workspaces");
}

export function createWorkspace(input: { name: string }): Promise<WorkspaceData> {
  return request<WorkspaceData>("/api/workspaces", { method: "POST", body: JSON.stringify(input) });
}

export function updateWorkspace(workspaceId: string, patch: { name: string }): Promise<WorkspaceData> {
  return request<WorkspaceData>(`/api/workspaces/${workspaceId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteWorkspace(workspaceId: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
}

export function updateBoard(boardId: string, patch: Partial<Pick<BoardData, "name" | "locked" | "memberIds">>): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteBoard(boardId: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/boards/${boardId}`, { method: "DELETE" });
}

export function addList(boardId: string, title: string): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}/lists`, { method: "POST", body: JSON.stringify({ title }) });
}

export function renameList(boardId: string, listId: string, title: string): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}/lists/${listId}`, { method: "PATCH", body: JSON.stringify({ title }) });
}

export function deleteList(boardId: string, listId: string): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}/lists/${listId}`, { method: "DELETE" });
}

export function addCard(boardId: string, listId: string, title: string): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}/lists/${listId}/cards`, { method: "POST", body: JSON.stringify({ title }) });
}

export function updateCard(boardId: string, cardId: string, patch: Partial<Omit<CardData, "id">>): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function moveCard(boardId: string, cardId: string, fromListId: string, toListId: string): Promise<BoardData> {
  return request<BoardData>(`/api/boards/${boardId}/move-card`, { method: "POST", body: JSON.stringify({ cardId, fromListId, toListId }) });
}
