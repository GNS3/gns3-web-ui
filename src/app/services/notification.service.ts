import { Injectable } from '@angular/core';
import { Server } from '../models/server';

@Injectable()
export class NotificationService {
  notificationsPath(server: Server): string {
    let protocol:string = "ws"
	  if (server.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${server.host}:${server.port}/v3/notifications/ws`;
  }

  
  projectNotificationsPath(server: Server, project_id: string): string {
    let protocol:string = "ws"
	  if (server.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${server.host}:${server.port}/v3/projects/${project_id}/notifications/ws`;
  }
}
