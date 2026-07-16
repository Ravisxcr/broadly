"use client";

import { useCallback, useRef } from "react";
import type { CardData } from "../types";

type CardPatch = Partial<Omit<CardData, "id">>;

// Debounces text-field patches (title/desc/due) to one mutation per 500ms of
// inactivity, per card. Applies the patch to the query cache synchronously first
// so typing never visibly lags behind the debounced network call.
export function useDebouncedCardPatch(
  patchCache: (boardId: string, cardId: string, patch: CardPatch) => void,
  mutate: (vars: { boardId: string; cardId: string; patch: CardPatch }) => void,
  delayMs = 500
): (boardId: string, cardId: string, patch: CardPatch) => void {
  const timers = useRef<Record<string, { boardId: string; patch: CardPatch; timer: ReturnType<typeof setTimeout> }>>({});

  return useCallback(
    (boardId: string, cardId: string, patch: CardPatch) => {
      patchCache(boardId, cardId, patch);

      const existing = timers.current[cardId];
      const merged = { ...(existing?.patch ?? {}), ...patch };
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => {
        delete timers.current[cardId];
        mutate({ boardId, cardId, patch: merged });
      }, delayMs);
      timers.current[cardId] = { boardId, patch: merged, timer };
    },
    [patchCache, mutate, delayMs]
  );
}
