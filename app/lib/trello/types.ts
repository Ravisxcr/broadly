export type ViewName = "login" | "dashboard" | "board" | "admin";
export type ThemeMode = "light" | "dark" | "system";
export type Role = "admin" | "member";

export interface Member {
  id: string;
  initials: string;
  name: string;
  email: string;
  color: string;
  role: Role;
}

/** A registered account from the auth provider, as returned by GET /api/members. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
}

export interface Label {
  id: string;
  color: string;
  name: string;
}

interface ChecklistItem {
  text: string;
  done: boolean;
}

interface CardComment {
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
}

export interface CardData {
  id: string;
  title: string;
  labelIds: string[];
  memberIds: string[];
  due: string | null;
  desc: string;
  checklist: ChecklistItem[];
  comments: CardComment[];
}

export interface ListData {
  id: string;
  title: string;
  cards: CardData[];
}

export interface BoardData {
  id: string;
  name: string;
  cover: string;
  memberIds: string[];
  lists: ListData[];
  locked?: boolean;
  workspaceId: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

export interface BoardTemplate {
  id: string;
  name: string;
  desc: string;
  lists: string[];
}

export interface ThemeColors {
  bgApp: string;
  text: string;
  textSecondary: string;
  panelBg: string;
  border: string;
  subtleBg: string;
  inputBg: string;
  accent: string;
  accentSubtle: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
}

export interface CardDoc extends CardData {
  boardId: string;
  listId: string;
}

export interface ListDoc {
  id: string;
  boardId: string;
  title: string;
  cardIds: string[];
}

export interface BoardDoc {
  id: string;
  name: string;
  cover: string;
  memberIds: string[];
  listIds: string[];
  locked?: boolean;
  workspaceId: string;
}
