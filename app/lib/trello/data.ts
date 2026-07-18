import type { BoardData, BoardTemplate, CardData, Label, Member, ThemeColors, WorkspaceData } from "./types";

export const LABEL_PALETTE: Label[] = [
  { id: "l1", color: "#22C55E", name: "Green" },
  { id: "l2", color: "#EAB308", name: "Yellow" },
  { id: "l3", color: "#F97316", name: "Orange" },
  { id: "l4", color: "#EF4444", name: "Red" },
  { id: "l5", color: "#A855F7", name: "Purple" },
  { id: "l6", color: "#06B6D4", name: "Sky" },
];

export const DEFAULT_ROSTER: Member[] = [
  { id: "f7b5392d-948a-4467-872e-33306b3a0110", initials: "AR", name: "Ari", email: "ari@studio.com", color: "#4F46E5", role: "admin" },
  { id: "a94025a1-7785-4089-a226-e414c5b3ab3b", initials: "JS", name: "Jess", email: "jess@studio.com", color: "#EA580C", role: "member" },
  { id: "84e8574e-6e4f-4d94-b152-32b0051e5e01", initials: "KM", name: "Kim", email: "kim@studio.com", color: "#16A34A", role: "member" },
  { id: "37a54917-8e67-42f5-b28e-324c08470a6c", initials: "TN", name: "Tomas", email: "tomas@studio.com", color: "#9333EA", role: "member" },
];

export const AVATAR_COLORS = ["#4F46E5", "#EA580C", "#16A34A", "#9333EA", "#0891B2", "#DB2777"];

export const BOARD_COVERS = ["#3B82F6", "#EA580C", "#9333EA", "#16A34A", "#475569", "#E11D48"];

export const WORKSPACE_COLORS = ["#4F46E5", "#0891B2", "#16A34A", "#DB2777", "#EA580C", "#475569"];

export const DEFAULT_WORKSPACES: WorkspaceData[] = [{ id: "d40a2bb8-c6bc-4bc9-a9c1-7cb4ff495147", name: "Boardly Studio", color: "#4F46E5", memberIds: [] }];

export function groupByWorkspace(boards: BoardData[], workspaces: WorkspaceData[]): { workspace: WorkspaceData; boards: BoardData[] }[] {
  return workspaces.map((workspace) => ({ workspace, boards: boards.filter((b) => b.workspaceId === workspace.id) }));
}

export const COLUMN_TEMPLATES: BoardTemplate[] = [
  { id: "todo3", name: "To Do / Doing / Done", desc: "Simple 3-column flow for most projects.", lists: ["To Do", "Doing", "Done"] },
  { id: "kanban4", name: "Backlog / In Progress / Review / Done", desc: "Adds a review step before things ship.", lists: ["Backlog", "In Progress", "Review", "Done"] },
  { id: "content", name: "Ideas / Writing / Editing / Published", desc: "For content and editorial pipelines.", lists: ["Ideas", "Writing", "Editing", "Published"] },
  { id: "single", name: "Single list", desc: "Start blank with one list, add more later.", lists: ["To Do"] },
];

export function labelById(id: string): Label | undefined {
  return LABEL_PALETTE.find((l) => l.id === id);
}

export function memberById(roster: Member[], id: string): Member | undefined {
  return roster.find((m) => m.id === id);
}

export function findCard(boards: BoardData[], boardId: string, cardId: string): CardData | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  for (const list of board.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}

export function findCardListId(boards: BoardData[], boardId: string, cardId: string): string | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.cards.some((c) => c.id === cardId));
  return list?.id ?? null;
}

export function canAccessBoard(board: BoardData, workspaces: WorkspaceData[], userId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (board.memberIds.includes(userId)) return true;
  const workspace = workspaces.find((w) => w.id === board.workspaceId);
  return !!workspace?.memberIds.includes(userId);
}



export function getThemeColors(dark: boolean): ThemeColors {
  return {
    bgApp: dark ? "#14151A" : "#FAFAF9",
    text: dark ? "#ECEBE8" : "#1F2430",
    textSecondary: dark ? "#9A9790" : "#726F68",
    panelBg: dark ? "#1E2027" : "#FFFFFF",
    border: dark ? "#2E3038" : "#E8E6E1",
    subtleBg: dark ? "#262830" : "#F4F3F0",
    inputBg: dark ? "#1A1B21" : "#FAFAF9",
    accent: "#4F46E5",
    accentSubtle: dark ? "rgba(79,70,229,0.28)" : "#EEF2FF",
    warningBg: dark ? "rgba(217,119,6,0.18)" : "#FEF3C7",
    warningBorder: dark ? "rgba(217,119,6,0.4)" : "#FDE68A",
    warningText: dark ? "#FBBF24" : "#92400E",
  };
}
