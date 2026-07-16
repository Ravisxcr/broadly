"use client";

import { useState } from "react";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import DashboardView from "./DashboardView";
import AdminView from "./AdminView";
import BoardView from "./BoardView";
import CreateBoardModal from "./CreateBoardModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import CardModal from "./CardModal";

export default function MainLayout() {
  const { theme } = useTheme();
  const { view, selectedCardId } = useNavigation();

  const [creatingBoard, setCreatingBoard] = useState(false);
  const [creatingBoardWorkspaceId, setCreatingBoardWorkspaceId] = useState<string | undefined>(undefined);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const openCreateBoard = (workspaceId?: string) => {
    setCreatingBoardWorkspaceId(workspaceId);
    setCreatingBoard(true);
  };
  const openCreateWorkspace = () => setCreatingWorkspace(true);

  return (
    <div style={{ width: "100%", height: "100vh", background: theme.bgApp, color: theme.text, overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", width: "100%", height: "100vh" }}>
        <Sidebar onOpenCreateBoard={openCreateBoard} onOpenCreateWorkspace={openCreateWorkspace} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopNav />

          {view === "dashboard" && <DashboardView onOpenCreateBoard={openCreateBoard} onOpenCreateWorkspace={openCreateWorkspace} />}
          {view === "admin" && <AdminView />}
          {view === "board" && <BoardView />}
        </div>
      </div>

      {creatingBoard && <CreateBoardModal initialWorkspaceId={creatingBoardWorkspaceId} onClose={() => setCreatingBoard(false)} />}
      {creatingWorkspace && <CreateWorkspaceModal onClose={() => setCreatingWorkspace(false)} />}
      {selectedCardId && <CardModal />}
    </div>
  );
}
