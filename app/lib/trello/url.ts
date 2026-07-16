import type { ViewName } from "./types";

export interface UrlTarget {
  view: ViewName;
  boardId: string | null;
  cardId: string | null;
}

export function parseUrlTarget(pathname: string, searchParams: URLSearchParams): UrlTarget {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "admin") return { view: "admin", boardId: null, cardId: null };
  if (segments[0] === "board" && segments[1]) {
    return { view: "board", boardId: decodeURIComponent(segments[1]), cardId: searchParams.get("card") };
  }
  return { view: "dashboard", boardId: null, cardId: null };
}

export function buildUrl(view: ViewName, boardId: string | null, cardId: string | null): string {
  if (view === "admin") return "/admin";
  if (view === "board" && boardId) {
    const path = `/board/${encodeURIComponent(boardId)}`;
    return cardId ? `${path}?card=${encodeURIComponent(cardId)}` : path;
  }
  if (view === "login") return "/";
  return "/dashboard";
}
