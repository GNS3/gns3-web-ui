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
  // Built field by field (never via spread/destructuring) so the password
  // has no path into the serialized payload. The explicit Omit<...>
  // annotation turns a forgotten field into a compile error instead of a
  // silent persistence drop.
  const sanitized: Omit<Controller, 'password'> = {
    authToken: controller.authToken,
    id: controller.id,
    name: controller.name,
    location: controller.location,
    host: controller.host,
    port: controller.port,
    path: controller.path,
    ubridge_path: controller.ubridge_path,
    status: controller.status,
    protocol: controller.protocol,
    username: controller.username,
    tokenExpired: controller.tokenExpired,
  };
  return JSON.stringify(sanitized);
}
