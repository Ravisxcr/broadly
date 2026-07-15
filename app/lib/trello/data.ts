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
  { id: "u1", initials: "AR", name: "Ari", email: "ari@studio.com", color: "#4F46E5", role: "admin" },
  { id: "u2", initials: "JS", name: "Jess", email: "jess@studio.com", color: "#EA580C", role: "member" },
  { id: "u3", initials: "KM", name: "Kim", email: "kim@studio.com", color: "#16A34A", role: "member" },
  { id: "u4", initials: "TN", name: "Tomas", email: "tomas@studio.com", color: "#9333EA", role: "member" },
];

export const AVATAR_COLORS = ["#4F46E5", "#EA580C", "#16A34A", "#9333EA", "#0891B2", "#DB2777"];

export const BOARD_COVERS = ["#3B82F6", "#EA580C", "#9333EA", "#16A34A", "#475569", "#E11D48"];

export const WORKSPACE_COLORS = ["#4F46E5", "#0891B2", "#16A34A", "#DB2777", "#EA580C", "#475569"];

export const DEFAULT_WORKSPACES: WorkspaceData[] = [{ id: "w1", name: "Boardly Studio", color: "#4F46E5", memberIds: [] }];

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

function card(id: string, title: string, opts: Partial<Omit<CardData, "id" | "title">> = {}): CardData {
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

export function initialBoards(): BoardData[] {
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

export function getThemeColors(dark: boolean): ThemeColors {
  return {
    bgApp: dark ? "#14151A" : "#FAFAF9",
    text: dark ? "#ECEBE8" : "#1F2430",
    textSecondary: dark ? "#9A9790" : "#726F68",
    panelBg: dark ? "#1E2027" : "#FFFFFF",
    border: dark ? "#2E3038" : "#E8E6E1",
    subtleBg: dark ? "#262830" : "#F4F3F0",
    inputBg: dark ? "#1A1B21" : "#FAFAF9",
  };
}
