import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Server } from '../models/server';

@Injectable()
export class NotificationService {
  notificationsPath(controller: Server): string {
    let protocol:string = "ws"
	  if (controller.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/notifications/ws?token=${controller.authToken}`;
  }

  
  projectNotificationsPath(controller: Server, project_id: string): string {
    let protocol:string = "ws"
	  if (controller.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/notifications/ws?token=${controller.authToken}`;
  }
}
