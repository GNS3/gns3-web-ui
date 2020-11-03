export type ServerAuthorization = 'basic' | 'none';
export type ServerLocation = 'local' | 'remote' | 'bundled';
export type ServerStatus = 'stopped' | 'starting' | 'running';
export type ServerProtocol = 'http' | 'https'

export class Server {
  id: number;
  name: string;
  location: ServerLocation;
  host: string;
  port: number;
  path: string;
  ubridge_path: string;
  authorization: ServerAuthorization;
  login: string;
  password: string;
  status: ServerStatus;
  protocol: ServerProtocol;
}
