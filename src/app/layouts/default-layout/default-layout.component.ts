import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ControllerService } from '../../services/controller.service';
import { ElectronService } from 'ngx-electron';
import { Subscription } from 'rxjs';
import { ProgressService } from '../../common/progress/progress.service';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { ControllerManagementService } from '../../services/controller-management.service';
import { ToasterService } from '../../services/toaster.service';
import { version } from './../../version';
import{ Controller } from '../../models/controller';

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

  controllerStatusSubscription: Subscription;
  shouldStopServersOnClosing = true;

  recentlyOpenedcontrollerId: string;
  recentlyOpenedProjectId: string;
  controllerIdProjectList: string;

  constructor(
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService,
    private controllerManagement: ControllerManagementService,
    private toasterService: ToasterService,
    private progressService: ProgressService,
    public router: Router,
    private serverService: ControllerService
  ) {}

  ngOnInit() {
   
    this.checkIfUserIsLoginPage();
    this.routeSubscription = this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) this.checkIfUserIsLoginPage();
    });
    
    this.recentlyOpenedcontrollerId = this.recentlyOpenedProjectService.getcontrollerId();
    this.recentlyOpenedProjectId = this.recentlyOpenedProjectService.getProjectId();
    this.controllerIdProjectList = this.recentlyOpenedProjectService.getcontrollerIdProjectList();

    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;

    // attach to notification stream when any of running local controllers experienced issues
    this.controllerStatusSubscription = this.controllerManagement.controllerStatusChanged.subscribe((serverStatus) => {
      if (serverStatus.status === 'errored') {
        console.error(serverStatus.message);
        this.toasterService.error(serverStatus.message);
      }
      if (serverStatus.status === 'stderr') {
        console.error(serverStatus.message);
        this.toasterService.error(serverStatus.message);
      }
    });

    // stop controllers only when in Electron
    this.shouldStopServersOnClosing = this.electronService.isElectronApp;
  }

  goToUserInfo() {
    let controllerId = this.router.url.split("/controller/")[1].split("/")[0];
    this.serverService.get(+controllerId).then((controller:Controller ) => {
      this.router.navigate(['/controller', controller.id, 'loggeduser']);
    });
  }

  goToDocumentation() {
    let controllerId = this.router.url.split("/controller/")[1].split("/")[0];
    this.serverService.get(+controllerId).then((controller:Controller ) => {
      (window as any).open(`http://${controller.host}:${controller.port}/docs`);
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
    let controllerId = this.router.url.split("/controller/")[1].split("/")[0];
    this.serverService.get(+controllerId).then((controller:Controller ) => {
      controller.authToken = null;
      this.serverService.update(controller).then(val => this.router.navigate(['/controller', controller.id, 'login']));
    });
  }

  listProjects() {
    this.router
      .navigate(['/controller', this.controllerIdProjectList, 'projects'])
      .catch((error) => this.toasterService.error('Cannot list projects'));
  }

  backToProject() {
    this.router
      .navigate(['/controller', this.recentlyOpenedcontrollerId, 'project', this.recentlyOpenedProjectId])
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
    await this.controllerManagement.stopAll();
    this.shouldStopServersOnClosing = false;
    this.progressService.deactivate();
    window.close();
    return false;
  }

  ngOnDestroy() {
    this.controllerStatusSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }
}
