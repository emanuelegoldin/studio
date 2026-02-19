import { WebSocketServer, WebSocket } from 'ws';
import { ThreadMessage } from './messages/thread-message';
import { JoinThreadMessage } from './messages/join-thread';
console.log('Starting WebSocket server on port', process.env.WS_PORT);
const WS_PORT: number = parseInt(process.env.WS_PORT || '8888', 10);
const wss = new WebSocketServer({ port: WS_PORT });

const rooms = new Map<string, Set<WebSocket>>();
const socketRooms = new WeakMap<WebSocket, Set<string>>();

wss.on('connection', function connection(ws) {
  console.log('New client connected');
  ws.on('error', console.error);

  ws.on('close', () => {
    const joinedRooms = socketRooms.get(ws);
    if (!joinedRooms) return;
    for (const roomId of joinedRooms) {
      const room = rooms.get(roomId);
      if (!room) continue;
      room.delete(ws);
      if (room.size === 0) rooms.delete(roomId);
    }
    socketRooms.delete(ws);
  });

  ws.on('message', function message(data) {
    let message: unknown;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (!message || typeof message !== 'object') return;
    const msgType = (message as { type?: unknown }).type;
    if (typeof msgType !== 'string') return;

    if (msgType === 'join-thread') {
      const { threadId } = (message as JoinThreadMessage).body ?? {};
      if (!threadId || typeof threadId !== 'string') return;
      joinRoom(threadId, ws);
      return;
    }

    if (msgType === 'thread-message') {
      const { threadId, username, content } = (message as ThreadMessage).body ?? {};
      if (!threadId || typeof threadId !== 'string') return;
      if (!username || typeof username !== 'string') return;
      if (!content || typeof content !== 'string') return;

      joinRoom(threadId, ws);
      broadcastToRoom(threadId, { username, content }, ws);
    }
  });
});

function joinRoom(roomId: string, ws: WebSocket) {
  let room = rooms.get(roomId);
  if (!room) {
    room = new Set<WebSocket>();
    rooms.set(roomId, room);
  }
  room.add(ws);

  let joinedRooms = socketRooms.get(ws);
  if (!joinedRooms) {
    joinedRooms = new Set<string>();
    socketRooms.set(ws, joinedRooms);
  }
  joinedRooms.add(roomId);
}

function broadcastToRoom(
  roomId: string,
  data: { username: string; content: string },
  exceptSocket: WebSocket | null = null
) {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const client of room) {
    if (client.readyState === WebSocket.OPEN && client !== exceptSocket) {
      client.send(JSON.stringify(data));
    }
  }
}