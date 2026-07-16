import { Suspense } from "react";
import { TrelloProviders } from "../lib/trello/contexts/TrelloProviders";

export default function TrelloLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TrelloProviders>{children}</TrelloProviders>
    </Suspense>
  );
}
