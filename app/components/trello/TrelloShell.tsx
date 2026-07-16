"use client";

import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useWorkspaces } from "../../lib/trello/contexts/WorkspacesContext";
import LoginView from "./LoginView";
import MainLayout from "./MainLayout";

export default function TrelloShell() {
  const { currentUserId } = useAuth();
  const { theme } = useTheme();
  const boardsQuery = useBoards();
  const workspacesQuery = useWorkspaces();

  if (!currentUserId) return <LoginView />;

  if (!boardsQuery.hasData || !workspacesQuery.hasData) {
    return (
      <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: theme.bgApp, color: theme.text }}>
        {boardsQuery.isError || workspacesQuery.isError ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Couldn&apos;t load boards. Is MongoDB running?</div>
            <button
              onClick={() => {
                boardsQuery.refetch();
                workspacesQuery.refetch();
              }}
              style={{ padding: "8px 16px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
            >
              Retry
            </button>
          </>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading boards…</div>
        )}
      </div>
    );
  }

  return <MainLayout />;
}
