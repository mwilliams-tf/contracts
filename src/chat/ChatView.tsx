import { Routes, Route } from "react-router-dom";
import { ConversationView } from "./ConversationView";
import { Inbox } from "./Inbox";

interface ChatViewProps {
  userId: string | null;
}

export function ChatView({ userId }: ChatViewProps) {
  return (
    <Routes>
      <Route index element={<Inbox userId={userId} />} />
      <Route path="c/:conversationId" element={<ConversationView userId={userId} />} />
    </Routes>
  );
}
