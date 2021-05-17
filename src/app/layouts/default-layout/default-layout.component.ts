import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ServerService } from '../../services/server.service';
import { ElectronService } from 'ngx-electron';
import { Subscription } from 'rxjs';
import { ProgressService } from '../../common/progress/progress.service';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { ServerManagementService } from '../../services/server-management.service';
import { ToasterService } from '../../services/toaster.service';
import { UserService } from '../../services/user.service';
import { version } from './../../version';
import { Server } from '../../models/server';

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

  constructor(
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService,
    private serverManagement: ServerManagementService,
    private toasterService: ToasterService,
    private progressService: ProgressService,
    private router: Router,
    private serverService: ServerService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.checkIfUserIsLoginPage();
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
    let serverId = this.router.url.split("/server/")[1].split("/")[0];
    this.serverService.get(+serverId).then((server: Server) => {
      this.router.navigate(['/server', server.id, 'loggeduser']);
    });
  }

  checkIfUserIsLoginPage() {
    if (this.router.url.includes("login")) {
      this.isLoginPage = true;
    } else {
      this.isLoginPage = false;
    }
  }

  logout() {
    let serverId = this.router.url.split("/server/")[1].split("/")[0];
    this.serverService.get(+serverId).then((server: Server) => {
      server.authToken = null;
      this.serverService.update(server).then(val => this.router.navigate(['/server', server.id, 'login']));
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
