import { io } from 'socket.io-client';

/**
 * Shared Socket.io client.
 *
 * Connects to the same origin: in production Express serves both the app
 * and the socket; in development Vite proxies `/socket.io` to the server
 * (see vite.config.js).
 */
export const socket = io({
  transports: ['websocket', 'polling'],
  autoConnect: true,
});
