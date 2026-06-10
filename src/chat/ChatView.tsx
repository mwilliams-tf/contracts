import { Routes, Route } from "react-router-dom";
import { ConversationView } from "./ConversationView";
import { Inbox } from "./Inbox";

export function ChatView() {
  return (
    <Routes>
      <Route index element={<Inbox />} />
      <Route path="c/:conversationId" element={<ConversationView />} />
    </Routes>
  );
}
