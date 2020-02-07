import { Injectable } from '@angular/core';

@Injectable()
export class RecentlyOpenedProjectService {
    private serverId: string;
    private projectId: string;
    
    setServerId(serverId: string) {
        this.serverId = serverId;
    }

    setProjectId(projectId: string) {
        this.projectId = projectId;
    }

    getServerId(): string {
        return this.serverId;
    }

    getProjectId(): string {
        return this.projectId;
    }
}
