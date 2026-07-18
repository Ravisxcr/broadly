"use client";

import * as React from "react";
import type { ToastAction } from "./toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement<typeof ToastAction>;
  variant?: "default" | "destructive";
  open: boolean;
};

type Toast = Omit<ToasterToast, "id" | "open">;

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string };

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function queueRemoval(toastId: string) {
  if (timeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    timeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);
  timeouts.set(toastId, timeout);
}

function reducer(state: ToasterToast[], action: Action): ToasterToast[] {
  switch (action.type) {
    case "ADD_TOAST":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    case "DISMISS_TOAST":
      queueRemoval(action.toastId);
      return state.map((t) => (t.id === action.toastId ? { ...t, open: false } : t));
    case "REMOVE_TOAST":
      return state.filter((t) => t.id !== action.toastId);
  }
}

let state: ToasterToast[] = [];
const listeners: Array<(state: ToasterToast[]) => void> = [];

function dispatch(action: Action) {
  state = reducer(state, action);
  listeners.forEach((listener) => listener(state));
}

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) => dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id, open: true },
  });

  return { id, dismiss, update };
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(state);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
export type { ToasterToast };
