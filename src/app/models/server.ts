export type ServerAuthorization = 'basic' | 'none';
export type ServerLocation = 'local' | 'remote';
export type ServerStatus = 'stopped' | 'starting' | 'running';

export class Server {
  id: number;
  name: string;
  location: ServerLocation;
  host: string;
  port: number;
  path: string;
  authorization: ServerAuthorization;
  login: string;
  password: string;
  is_local: boolean;
  status: ServerStatus;
}
