import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Server } from '../models/server';

@Injectable()
export class NotificationService {
  notificationsPath(server: Server): string {
    let protocol:string = "ws"
	  if (server.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${server.host}:${server.port}/${environment.current_version}/notifications/ws?token=${server.authToken}`;
  }

  
  projectNotificationsPath(server: Server, project_id: string): string {
    let protocol:string = "ws"
	  if (server.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${server.host}:${server.port}/${environment.current_version}/projects/${project_id}/notifications/ws?token=${server.authToken}`;
  }
}
