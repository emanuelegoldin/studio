import { WebSocketServer } from 'ws';
const WS_PORT: number = parseInt(process.env.WS_PORT || '8080', 10);
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});