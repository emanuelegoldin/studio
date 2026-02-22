import { WSMessage } from "./ws-message";

export interface ThreadRefreshMessage extends WSMessage {
  type: 'thread-refresh';
  body: {
    threadId: string;
  }
}