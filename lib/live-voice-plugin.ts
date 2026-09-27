import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import type { Plugin } from 'vite';
import { liveSession, LIVE_MODEL } from './live';
import { relayLive } from './live-relay';
import { createGameGuide } from './live-game';
import { createDemoGuide } from './live-demo';
import { demoCopy, demoQueue, caseStage, focalId, stages } from './hiring-demo';
import { questions, profiles, scoreAnswers, interestLabels } from './quiz';
import { createVoiceLab } from './voice-lab-server';
const gameGuide = createGameGuide({ questions, profiles, scoreAnswers, interestLabels });
const demoGuide = createDemoGuide({ demoCopy, demoQueue, caseStage, focalId, stages });

// Local development only: stream PCM through a trusted server connection.
export function liveVoice(): Plugin {
  let closeRelay: () => Promise<void> = async () => {};
  return { async closeBundle() { await closeRelay(); }, name: 'navi-local-live-voice', apply: 'serve', async configureServer(server) {
    server.middlewares.use(createVoiceLab(server.config.root));
    // Vite reloads this module during config changes; the preceding listener must finish closing first.
    const runtime = globalThis as typeof globalThis & { __naviCloseRelay?: () => Promise<void> };
    await runtime.__naviCloseRelay?.();
    const sockets = new WebSocketServer({ noServer: true, maxPayload: 20000 });
    const relay = createServer((_request, response) => { response.writeHead(404); response.end(); });
    relay.on('upgrade', (request, socket, head) => {
      if (request.url?.split('?')[0] !== '/api/live/stream') { socket.destroy(); return; }
      const host = request.headers.host || '';
      if (host !== '127.0.0.1:5174' || !['http://localhost:5173', 'http://127.0.0.1:5173'].includes(request.headers.origin || '')) { socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
      let key = '';
      try {
        const line = readFileSync(resolve(server.config.root, '.dev.vars'), 'utf8').split('\n').find(line => /^OPENAI_API_KEY\s*=/.test(line));
        key = line?.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || '';
      } catch { /* Report missing configuration without exposing file contents. */ }
      if (!key) { socket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n'); return; }
      sockets.handleUpgrade(request, socket, head, client => {
        relayLive(client, () => new WebSocket(`wss://api.openai.com/v1/realtime?model=${LIVE_MODEL}`, { headers: { Authorization: `Bearer ${key}` }, handshakeTimeout: 15000 }), liveSession, gameGuide, demoGuide);
      });
    });
    let closing: Promise<void> | undefined;
    const shutdown = () => closing ||= new Promise<void>(resolve => {
      for (const client of sockets.clients) client.terminate();
      sockets.close();
      relay.close(() => { if (runtime.__naviCloseRelay === shutdown) delete runtime.__naviCloseRelay; resolve(); });
    });
    closeRelay = shutdown; runtime.__naviCloseRelay = shutdown;
    server.httpServer?.once('close', () => { void shutdown(); });
    await new Promise<void>((resolve, reject) => { relay.once('error', reject); relay.listen(5174, '127.0.0.1', resolve); });
  } };
}
