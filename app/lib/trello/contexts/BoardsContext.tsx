"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as api from "../api";
import { useDebouncedCardPatch } from "../hooks/useDebouncedCardPatch";
import type { BoardData, CardData } from "../types";

type CardPatch = Partial<Omit<CardData, "id">>;

function replaceBoardInCache(queryClient: QueryClient, board: BoardData) {
  queryClient.setQueryData<BoardData[]>(["boards"], (old) => old?.map((b) => (b.id === board.id ? board : b)));
}

function patchCardInCache(queryClient: QueryClient, boardId: string, cardId: string, patch: CardPatch) {
  queryClient.setQueryData<BoardData[]>(["boards"], (old) =>
    old?.map((b) =>
      b.id !== boardId
        ? b
        : { ...b, lists: b.lists.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id !== cardId ? c : { ...c, ...patch })) })) }
    )
  );
}

interface BoardsContextValue {
  boards: BoardData[];
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  refetch(): void;
  createBoard(input: { name: string; templateId: string; memberIds: string[]; workspaceId: string }): Promise<BoardData>;
  updateBoard(boardId: string, patch: Partial<Pick<BoardData, "name" | "locked" | "memberIds">>): void;
  deleteBoard(boardId: string): void;
  addList(boardId: string, title: string): void;
  renameList(boardId: string, listId: string, title: string): void;
  deleteList(boardId: string, listId: string): void;
  addCard(boardId: string, listId: string, title: string): void;
  updateCard(boardId: string, cardId: string, patch: CardPatch): void;
  moveCard(boardId: string, cardId: string, fromListId: string, toListId: string): void;
  patchCardDebounced(boardId: string, cardId: string, patch: CardPatch): void;
}

const BoardsContext = createContext<BoardsContextValue | null>(null);

export function BoardsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const boardsQuery = useQuery({ queryKey: ["boards"], queryFn: api.fetchBoards, refetchInterval: 3000 });

  // Mutations declared unconditionally (Rules of Hooks) — each syncs the
  // ["boards"] query cache on success; the ones firing from high-frequency
  // interactions (drag, card edits) also apply an optimistic update in
  // onMutate and roll back on error.
  const createBoardMutation = useMutation({
    mutationFn: api.createBoard,
    onSuccess: (board) => {
      queryClient.setQueryData<BoardData[]>(["boards"], (old) => [...(old ?? []), board]);
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: (vars: { boardId: string; patch: Partial<Pick<BoardData, "name" | "locked" | "memberIds">> }) => api.updateBoard(vars.boardId, vars.patch),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      queryClient.setQueryData<BoardData[]>(["boards"], (old) => old?.map((b) => (b.id !== vars.boardId ? b : { ...b, ...vars.patch })));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => api.deleteBoard(boardId),
    onMutate: async (boardId) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      queryClient.setQueryData<BoardData[]>(["boards"], (old) => old?.filter((b) => b.id !== boardId));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
  });

  const addListMutation = useMutation({
    mutationFn: (vars: { boardId: string; title: string }) => api.addList(vars.boardId, vars.title),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const renameListMutation = useMutation({
    mutationFn: (vars: { boardId: string; listId: string; title: string }) => api.renameList(vars.boardId, vars.listId, vars.title),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const deleteListMutation = useMutation({
    mutationFn: (vars: { boardId: string; listId: string }) => api.deleteList(vars.boardId, vars.listId),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const addCardMutation = useMutation({
    mutationFn: (vars: { boardId: string; listId: string; title: string }) => api.addCard(vars.boardId, vars.listId, vars.title),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const updateCardMutation = useMutation({
    mutationFn: (vars: { boardId: string; cardId: string; patch: CardPatch }) => api.updateCard(vars.boardId, vars.cardId, vars.patch),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      patchCardInCache(queryClient, vars.boardId, vars.cardId, vars.patch);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const moveCardMutation = useMutation({
    mutationFn: (vars: { boardId: string; cardId: string; fromListId: string; toListId: string }) =>
      api.moveCard(vars.boardId, vars.cardId, vars.fromListId, vars.toListId),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      queryClient.setQueryData<BoardData[]>(["boards"], (old) =>
        old?.map((b) => {
          if (b.id !== vars.boardId) return b;
          let moved: CardData | null = null;
          const lists = b.lists.map((l) => {
            if (l.id !== vars.fromListId) return l;
            moved = l.cards.find((c) => c.id === vars.cardId) ?? null;
            return { ...l, cards: l.cards.filter((c) => c.id !== vars.cardId) };
          });
          if (!moved) return b;
          return { ...b, lists: lists.map((l) => (l.id === vars.toListId ? { ...l, cards: [...l.cards, moved as CardData] } : l)) };
        })
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const patchCache = useCallback((boardId: string, cardId: string, patch: CardPatch) => patchCardInCache(queryClient, boardId, cardId, patch), [queryClient]);
  const mutateUpdateCard = useCallback((vars: { boardId: string; cardId: string; patch: CardPatch }) => updateCardMutation.mutate(vars), [updateCardMutation]);
  const patchCardDebounced = useDebouncedCardPatch(patchCache, mutateUpdateCard);

  const createBoard = useCallback(
    (input: { name: string; templateId: string; memberIds: string[]; workspaceId: string }) => createBoardMutation.mutateAsync(input),
    [createBoardMutation]
  );
  const updateBoard = useCallback(
    (boardId: string, patch: Partial<Pick<BoardData, "name" | "locked" | "memberIds">>) => updateBoardMutation.mutate({ boardId, patch }),
    [updateBoardMutation]
  );
  const deleteBoard = useCallback((boardId: string) => deleteBoardMutation.mutate(boardId), [deleteBoardMutation]);
  const addList = useCallback((boardId: string, title: string) => addListMutation.mutate({ boardId, title }), [addListMutation]);
  const renameList = useCallback((boardId: string, listId: string, title: string) => renameListMutation.mutate({ boardId, listId, title }), [renameListMutation]);
  const deleteList = useCallback((boardId: string, listId: string) => deleteListMutation.mutate({ boardId, listId }), [deleteListMutation]);
  const addCard = useCallback((boardId: string, listId: string, title: string) => addCardMutation.mutate({ boardId, listId, title }), [addCardMutation]);
  const updateCard = useCallback((boardId: string, cardId: string, patch: CardPatch) => updateCardMutation.mutate({ boardId, cardId, patch }), [updateCardMutation]);
  const moveCard = useCallback(
    (boardId: string, cardId: string, fromListId: string, toListId: string) => moveCardMutation.mutate({ boardId, cardId, fromListId, toListId }),
    [moveCardMutation]
  );

  const boardsRefetch = boardsQuery.refetch;
  const refetch = useCallback(() => {
    boardsRefetch();
  }, [boardsRefetch]);

  const value = useMemo<BoardsContextValue>(
    () => ({
      boards: boardsQuery.data ?? [],
      isLoading: boardsQuery.isLoading,
      isError: boardsQuery.isError,
      hasData: boardsQuery.data !== undefined,
      refetch,
      createBoard,
      updateBoard,
      deleteBoard,
      addList,
      renameList,
      deleteList,
      addCard,
      updateCard,
      moveCard,
      patchCardDebounced,
    }),
    [
      boardsQuery.data,
      boardsQuery.isLoading,
      boardsQuery.isError,
      refetch,
      createBoard,
      updateBoard,
      deleteBoard,
      addList,
      renameList,
      deleteList,
      addCard,
      updateCard,
      moveCard,
      patchCardDebounced,
    ]
  );

  return <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>;
}

export function useBoards(): BoardsContextValue {
  const ctx = useContext(BoardsContext);
  if (!ctx) throw new Error("useBoards must be used within a BoardsProvider");
  return ctx;
}
