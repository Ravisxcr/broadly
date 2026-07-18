"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { cn } from "../../lib/utils";

function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogPortal(props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn("fixed inset-0 z-[100] bg-black/50 transition-opacity", className)}
      {...props}
    />
  );
}

function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const { theme } = useTheme();
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[101] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-6 shadow-2xl sm:max-w-[420px]",
          className
        )}
        style={{ background: theme.panelBg, borderColor: theme.border, color: theme.text, fontFamily: "inherit" }}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-header" className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="alert-dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-[15px] font-extrabold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  const { theme } = useTheme();
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-[13px] leading-relaxed", className)}
      style={{ color: theme.textSecondary }}
      {...props}
    />
  );
}

const alertDialogButtonVariants = cva(
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-[13px] font-bold cursor-pointer transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        destructive: "text-white",
        outline: "border bg-transparent",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
);

function AlertDialogAction({
  className,
  style,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & VariantProps<typeof alertDialogButtonVariants>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(alertDialogButtonVariants({ variant: "destructive" }), className)}
      style={{ background: "#E11D48", fontFamily: "inherit", ...style }}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, style, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  const { theme } = useTheme();
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(alertDialogButtonVariants({ variant: "outline" }), className)}
      style={{ borderColor: theme.border, color: theme.textSecondary, fontFamily: "inherit", ...style }}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
