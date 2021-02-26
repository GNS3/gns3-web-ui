import { Injectable } from '@angular/core';

@Injectable()
export class RecentlyOpenedProjectService {
    private serverId: string;
    private projectId: string;

    private serverIdProjectList: string;
    
    setServerId(serverId: string) {
        this.serverId = serverId;
    }

    setProjectId(projectId: string) {
        this.projectId = projectId;
    }

    setServerIdProjectList(serverId: string) {
        this.serverIdProjectList = serverId;
    }

    getServerId() : string {
        return this.serverId;
    }

    getProjectId() : string {
        return this.projectId;
    }

    getServerIdProjectList() : string {
        return this.serverIdProjectList;
    }
 
    removeData() {
        this.serverId = '',
        this.projectId = ''
    }
}
