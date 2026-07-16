"use client";

import { useState } from "react";

export interface AnchoredMenu {
  rect: DOMRect | null;
  isOpen(id: string): boolean;
  toggle(id: string, anchorEl: HTMLElement): void;
  close(): void;
}

// Tracks which anchored id is open plus the DOMRect of its trigger, for the
// portal-positioned dropdown pattern used by workspace menus in Sidebar/DashboardView.
// Callers own the createPortal(...) JSX and position math themselves.
export function useAnchoredMenu(): AnchoredMenu {
  const [openId, setOpenId] = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  return {
    rect,
    isOpen: (id: string) => openId === id,
    toggle: (id: string, anchorEl: HTMLElement) => {
      setRect(anchorEl.getBoundingClientRect());
      setOpenId((current) => (current === id ? null : id));
    },
    close: () => setOpenId(null),
  };
}
