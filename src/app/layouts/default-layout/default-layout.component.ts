import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import { Subscription } from 'rxjs';
import { ProgressService } from '../../common/progress/progress.service';
import { Server } from '../../models/server';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { ServerManagementService } from '../../services/server-management.service';
import { ServerService } from '../../services/server.service';
import { ToasterService } from '../../services/toaster.service';
import { version } from './../../version';

@Component({
  selector: 'app-default-layout',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public isInstalledSoftwareAvailable = false;
  public uiVersion = version;
  public isLoginPage = false;
  public routeSubscription;

  serverStatusSubscription: Subscription;
  shouldStopServersOnClosing = true;

  recentlyOpenedServerId: string;
  recentlyOpenedProjectId: string;
  serverIdProjectList: string;
  controller: Server;

  constructor(
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService,
    private serverManagement: ServerManagementService,
    private toasterService: ToasterService,
    private progressService: ProgressService,
    private router: Router,
    private serverService: ServerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.checkIfUserIsLoginPage();
    this.controller = this.route.snapshot.data['server'];

    this.routeSubscription = this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) this.checkIfUserIsLoginPage();
    });

    this.recentlyOpenedServerId = this.recentlyOpenedProjectService.getServerId();
    this.recentlyOpenedProjectId = this.recentlyOpenedProjectService.getProjectId();
    this.serverIdProjectList = this.recentlyOpenedProjectService.getServerIdProjectList();

    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;

    // attach to notification stream when any of running local servers experienced issues
    this.serverStatusSubscription = this.serverManagement.serverStatusChanged.subscribe((serverStatus) => {
      if (serverStatus.status === 'errored') {
        console.error(serverStatus.message);
        this.toasterService.error(serverStatus.message);
      }
      if (serverStatus.status === 'stderr') {
        console.error(serverStatus.message);
        this.toasterService.error(serverStatus.message);
      }
    });

    // stop servers only when in Electron
    this.shouldStopServersOnClosing = this.electronService.isElectronApp;
  }

  goToUserInfo() {
    let serverId = this.router.url.split('/server/')[1].split('/')[0];
    this.serverService.get(+serverId).then((server: Server) => {
      this.router.navigate(['/server', server.id, 'loggeduser']);
    });
  }

  goToDocumentation() {
    let serverId = this.router.url.split('/server/')[1].split('/')[0];
    this.serverService.get(+serverId).then((server: Server) => {
      (window as any).open(`http://${server.host}:${server.port}/docs`);
    });
  }

  checkIfUserIsLoginPage() {
    if (this.router.url.includes('login')) {
      this.isLoginPage = true;
    } else {
      this.isLoginPage = false;
    }
  }

  logout() {
    let serverId = this.router.url.split('/server/')[1].split('/')[0];
    this.serverService.get(+serverId).then((server: Server) => {
      server.authToken = null;
      this.serverService.update(server).then((val) => this.router.navigate(['/server', server.id, 'login']));
    });
  }

  listProjects() {
    this.router
      .navigate(['/server', this.serverIdProjectList, 'projects'])
      .catch((error) => this.toasterService.error('Cannot list projects'));
  }

  backToProject() {
    this.router
      .navigate(['/server', this.recentlyOpenedServerId, 'project', this.recentlyOpenedProjectId])
      .catch((error) => this.toasterService.error('Cannot navigate to the last opened project'));
  }

  goToPreferences() {
    let controllerId = this.router.url.split('/server/')[1].split('/')[0];
    this.router
      .navigate(['/server', controllerId, 'preferences'])
      .catch((error) => this.toasterService.error('Cannot navigate to the preferences'));
  }

  goToSystemStatus() {
    let controllerId = this.router.url.split('/server/')[1].split('/')[0];
    this.router
      .navigate(['/server', controllerId, 'systemstatus'])
      .catch((error) => this.toasterService.error('Cannot navigate to the system status'));
  }
  goToImageManager() {
    let controllerId = this.router.url.split('/server/')[1].split('/')[0];
    this.router
      .navigate(['/server', controllerId, 'image-manager'])
      .catch((error) => this.toasterService.error('Cannot navigate to the system status'));
  }

  @HostListener('window:beforeunload', ['$event'])
  async onBeforeUnload($event) {
    if (!this.shouldStopServersOnClosing) {
      return;
    }
    $event.preventDefault();
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
    this.routeSubscription.unsubscribe();
  }
}
