export type ServerAuthorization = 'basic' | 'none';

export class Server {
  id: number;
  name: string;
  ip: string;
  port: number;
  authorization: ServerAuthorization;
  login: string;
  password: string;
  is_local: boolean;
}
