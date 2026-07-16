"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { TrelloProviders } from "./lib/trello/contexts/TrelloProviders";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <TrelloProviders>{children}</TrelloProviders>
      </Suspense>
    </QueryClientProvider>
  );
}
