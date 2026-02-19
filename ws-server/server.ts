import { WebSocketServer, WebSocket } from 'ws';
import { ThreadMessage } from './messages/thread-message';
const WS_PORT: number = parseInt(process.env.WS_PORT || '8080', 10);
const wss = new WebSocketServer({ port: WS_PORT });

const rooms: { [key: string]: WebSocket[] } = {};

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    const message = JSON.parse(data.toString());
    if (message.type === 'thread-message') {
      const { threadId, username, content } = (message as ThreadMessage).body;
      if (!rooms[threadId]) {
        rooms[threadId] = [];
      }
      rooms[threadId].push(ws);
      broadcastToRoom(threadId, { username, content }, ws);
    }
  });
});

function broadcastToRoom(roomId: string, data: {username: string, content: string}, exceptSocket: WebSocket | null = null) {
  rooms[roomId].forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== exceptSocket) {
      client.send(JSON.stringify(data));
    }
  });
}