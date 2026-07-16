"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import { BoardsProvider } from "./BoardsContext";
import { WorkspacesProvider } from "./WorkspacesContext";
import { NavigationProvider } from "./NavigationContext";

export function TrelloProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BoardsProvider>
          <WorkspacesProvider>
            <NavigationProvider>{children}</NavigationProvider>
          </WorkspacesProvider>
        </BoardsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
