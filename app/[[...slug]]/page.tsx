import { Suspense } from "react";
import TrelloApp from "../components/trello/TrelloApp";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <TrelloApp />
    </Suspense>
  );
}
