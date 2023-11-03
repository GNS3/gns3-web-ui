import { Server } from '../models/server';

export function getTestServer(): Server {
  const server = new Server();
  server.host = '127.0.0.1';
  server.port = 3080;
  server.authorization = 'none';
  server.protocol = 'http';
  return server;
}
