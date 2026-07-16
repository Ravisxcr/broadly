"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type { WorkspaceData } from "../types";

interface WorkspacesContextValue {
  workspaces: WorkspaceData[];
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  refetch(): void;
  createWorkspace(input: { name: string }): void;
  updateWorkspace(workspaceId: string, patch: Partial<Pick<WorkspaceData, "name" | "memberIds">>): void;
  deleteWorkspace(workspaceId: string): void;
}

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

export function WorkspacesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const workspacesQuery = useQuery({ queryKey: ["workspaces"], queryFn: api.fetchWorkspaces });

  const createWorkspaceMutation = useMutation({
    mutationFn: api.createWorkspace,
    onSuccess: (workspace) => {
      queryClient.setQueryData<WorkspaceData[]>(["workspaces"], (old) => [...(old ?? []), workspace]);
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: (vars: { workspaceId: string; patch: Partial<Pick<WorkspaceData, "name" | "memberIds">> }) => api.updateWorkspace(vars.workspaceId, vars.patch),
    onSuccess: (workspace) => {
      queryClient.setQueryData<WorkspaceData[]>(["workspaces"], (old) => old?.map((w) => (w.id === workspace.id ? workspace : w)));
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => api.deleteWorkspace(workspaceId),
    onSuccess: (_data, workspaceId) => {
      queryClient.setQueryData<WorkspaceData[]>(["workspaces"], (old) => old?.filter((w) => w.id !== workspaceId));
    },
  });

  const createWorkspace = useCallback((input: { name: string }) => createWorkspaceMutation.mutate(input), [createWorkspaceMutation]);
  const updateWorkspace = useCallback(
    (workspaceId: string, patch: Partial<Pick<WorkspaceData, "name" | "memberIds">>) => updateWorkspaceMutation.mutate({ workspaceId, patch }),
    [updateWorkspaceMutation]
  );
  const deleteWorkspace = useCallback((workspaceId: string) => deleteWorkspaceMutation.mutate(workspaceId), [deleteWorkspaceMutation]);

  const workspacesRefetch = workspacesQuery.refetch;
  const refetch = useCallback(() => {
    workspacesRefetch();
  }, [workspacesRefetch]);

  const value = useMemo<WorkspacesContextValue>(
    () => ({
      workspaces: workspacesQuery.data ?? [],
      isLoading: workspacesQuery.isLoading,
      isError: workspacesQuery.isError,
      hasData: workspacesQuery.data !== undefined,
      refetch,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
    }),
    [workspacesQuery.data, workspacesQuery.isLoading, workspacesQuery.isError, refetch, createWorkspace, updateWorkspace, deleteWorkspace]
  );

  return <WorkspacesContext.Provider value={value}>{children}</WorkspacesContext.Provider>;
}

export function useWorkspaces(): WorkspacesContextValue {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) throw new Error("useWorkspaces must be used within a WorkspacesProvider");
  return ctx;
}
