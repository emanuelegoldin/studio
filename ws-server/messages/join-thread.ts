import { WSMessage } from "./ws-message";

export interface JoinThreadMessage extends WSMessage {
  type: "join-thread";
  body: {
    threadId: string;
  };
}
