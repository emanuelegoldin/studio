import { WSMessage } from "./ws-message";

export interface ThreadMessage extends WSMessage {
  type: 'thread-message';
  body: {
    threadId: string;
    username: string;
    content: string;
  }
}