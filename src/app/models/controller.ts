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
  status: ControllerStatus = 'stopped'; // Initialize with default value
  protocol: ControllerProtocol;
  username: string;
  password: string;
  tokenExpired: boolean = false; // Initialize with default value
}

/**
 * Serialization shape for every place a controller is persisted to
 * browser storage. The password is deliberately excluded: storage is
 * shared by everyone using the browser profile and readable by any
 * script in the origin, so a persisted credential would leak the last
 * logged-in user's password. All writers must go through this helper —
 * never `JSON.stringify(controller)` directly.
 */
export function controllerStorageJson(controller: Controller): string {
  const { password, ...withoutPassword } = controller;
  return JSON.stringify(withoutPassword);
}
