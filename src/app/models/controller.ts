export type ServerLocation = 'local' | 'remote' | 'bundled';
export type ServerStatus = 'stopped' | 'starting' | 'running';
export type ServerProtocol = 'http:' | 'https:';

export class Controller {
  authToken: string;
  id: number;
  name: string;
  location: ServerLocation;
  host: string;
  port: number;
  path: string;
  ubridge_path: string;
  status: ServerStatus;
  protocol: ServerProtocol;
  username: string;
  password: string;
  tokenExpired: boolean;
}
