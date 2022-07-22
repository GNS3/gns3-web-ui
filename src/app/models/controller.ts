export type ControllerLocation = 'local' | 'remote' | 'bundled';
export type ControllerStatus = 'stopped' | 'starting' | 'running';
export type ControllerProtocol = 'http:' | 'https:';

export class Controller {
  authToken: string;
  id: number;
  name: string;
  location: ControllerLocation;
  host: string;
  port: number;
  path: string;
  ubridge_path: string;
  status: ControllerStatus;
  protocol: ControllerProtocol;
  username: string;
  password: string;
  tokenExpired: boolean;
}
