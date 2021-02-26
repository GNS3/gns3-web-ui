import { ElectronService } from 'ngx-electron';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, HostListener } from '@angular/core';
import { ServerManagementService } from '../../services/server-management.service';
import { Subscription } from 'rxjs';
import { ToasterService } from '../../services/toaster.service';
import { ProgressService } from '../../common/progress/progress.service';
import { version } from './../../version';
import { Router } from '@angular/router';


@Component({
  selector: 'app-default-layout',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss']
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public isInstalledSoftwareAvailable = false;
  public uiVersion = version;

  serverStatusSubscription: Subscription;
  shouldStopServersOnClosing = true;

  recentlyOpenedServerId : string;
  recentlyOpenedProjectId : string;
  serverIdProjectList: string;

  constructor(
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService,
    private serverManagement: ServerManagementService,
    private toasterService: ToasterService,
    private progressService: ProgressService,
    private router: Router
  ) {}

  ngOnInit() {
    this.recentlyOpenedServerId = this.recentlyOpenedProjectService.getServerId();
    this.recentlyOpenedProjectId = this.recentlyOpenedProjectService.getProjectId();
    this.serverIdProjectList = this.recentlyOpenedProjectService.getServerIdProjectList();
    
    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;

    // attach to notification stream when any of running local servers experienced issues
    this.serverStatusSubscription = this.serverManagement.serverStatusChanged.subscribe((serverStatus) => {
      if(serverStatus.status === 'errored') {
        console.error(serverStatus.message);
        this.toasterService.error(serverStatus.message);
      }
      if(serverStatus.status === 'stderr') {
        console.error(serverStatus.message);
        this.toasterService.error(serverStatus.message);
      }
    });

    // stop servers only when in Electron
    this.shouldStopServersOnClosing = this.electronService.isElectronApp;
  }

  listProjects() {
    this.router.navigate(['/server', this.serverIdProjectList, 'projects'])
      .catch(error => this.toasterService.error('Cannot list projects'));
  }

  backToProject() {
    this.router.navigate(['/server', this.recentlyOpenedServerId, 'project', this.recentlyOpenedProjectId])
      .catch(error => this.toasterService.error('Cannot navigate to the last opened project'));
  }

  @HostListener('window:beforeunload', ['$event'])
  async onBeforeUnload($event) {
    if(!this.shouldStopServersOnClosing) {
      return;
    }
    $event.preventDefault()
    $event.returnValue = false;
    this.progressService.activate();
    await this.serverManagement.stopAll();
    this.shouldStopServersOnClosing = false;
    this.progressService.deactivate();
    window.close();
    return false;
  }

  ngOnDestroy() {
    this.serverStatusSubscription.unsubscribe();
  }
}
