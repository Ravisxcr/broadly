"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { cn } from "../../lib/utils";

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed bottom-0 right-0 z-[200] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[380px]",
        className
      )}
      {...props}
    />
  );
}

const toastVariants = cva("", {
  variants: {
    variant: {
      default: "",
      destructive: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Toast({
  className,
  variant,
  style,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) {
  const { theme } = useTheme();
  const isDestructive = variant === "destructive";
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-8 shadow-2xl",
        toastVariants({ variant }),
        className
      )}
      style={{
        background: isDestructive ? theme.dangerBg : theme.panelBg,
        borderColor: isDestructive ? theme.dangerBorder : theme.border,
        color: isDestructive ? theme.dangerText : theme.text,
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title data-slot="toast-title" className={cn("text-[13.5px] font-bold", className)} {...props} />;
}

function ToastDescription({ className, style, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
  const { theme } = useTheme();
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-[12.5px] leading-relaxed", className)}
      style={{ color: theme.textSecondary, ...style }}
      {...props}
    />
  );
}

function ToastClose({ className, style, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
  const { theme } = useTheme();
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      className={cn("absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md cursor-pointer", className)}
      style={{ color: theme.textSecondary, ...style }}
      {...props}
    >
      <X size={14} />
    </ToastPrimitive.Close>
  );
}

function ToastAction(props: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return <ToastPrimitive.Action data-slot="toast-action" {...props} />;
}

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
