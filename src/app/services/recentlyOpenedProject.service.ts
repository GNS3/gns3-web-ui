import { Injectable } from '@angular/core';

@Injectable()
export class RecentlyOpenedProjectService {
  private controllerId: string;
  private projectId: string;

  private controllerIdProjectList: string;

  setcontrollerId(controllerId: string) {
    this.controllerId = controllerId;
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
  }

  setcontrollerIdProjectList(controllerId: string) {
    this.controllerIdProjectList = controllerId;
  }

  getcontrollerId(): string {
    return this.controllerId;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getcontrollerIdProjectList(): string {
    return this.controllerIdProjectList;
  }

  removeData() {
    (this.controllerId = ''), (this.projectId = '');
  }
}
