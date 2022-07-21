import{ Controller } from '../models/controller';

export function getTestServer():Controller  {
  const server = new Controller  ();
  server.host = '127.0.0.1';
  server.port = 3080;
  server.protocol = 'http:';
  return server;
}
