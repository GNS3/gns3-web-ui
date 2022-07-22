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
import { Controller } from '../../models/controller';

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
  shouldStopControllersOnClosing = true;
  recentlyOpenedcontrollerId: string;
  recentlyOpenedProjectId: string;
  controllerIdProjectList: string;
  controllerId: string | undefined | null;

  constructor(
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService,
    private controllerManagement: ControllerManagementService,
    private toasterService: ToasterService,
    private progressService: ProgressService,
    private router: Router,
    private route: ActivatedRoute,
    private controllerService: ControllerService
  ) {
    this.router.events.subscribe((data) => {
      if (data instanceof NavigationEnd) {
        this.controllerId = this.route.children[0].snapshot.paramMap.get("controller_id");
      }
    });
  }

  ngOnInit() {

    this.checkIfUserIsLoginPage();
    this.controller = this.route.snapshot.data['server'];

    this.routeSubscription = this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) this.checkIfUserIsLoginPage();
    });

    this.recentlyOpenedcontrollerId = this.recentlyOpenedProjectService.getcontrollerId();
    this.recentlyOpenedProjectId = this.recentlyOpenedProjectService.getProjectId();
    this.controllerIdProjectList = this.recentlyOpenedProjectService.getcontrollerIdProjectList();

    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;

    // attach to notification stream when any of running local controllers experienced issues
    this.controllerStatusSubscription = this.controllerManagement.controllerStatusChanged.subscribe((controllerStatus) => {
      if (controllerStatus.status === 'errored') {
        console.error(controllerStatus.message);
        this.toasterService.error(controllerStatus.message);
      }
      if (controllerStatus.status === 'stderr') {
        console.error(controllerStatus.message);
        this.toasterService.error(controllerStatus.message);
      }
    });

    // stop controllers only when in Electron
    this.shouldStopControllersOnClosing = this.electronService.isElectronApp;
  }

  goToDocumentation() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      (window as any).open(`http://${controller.host}:${controller.port}/docs`);
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
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      controller.authToken = null;
      this.controllerService.update(controller).then(val => this.router.navigate(['/controller', controller.id, 'login']));
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
    if (!this.shouldStopControllersOnClosing) {
      return;
    }
    $event.preventDefault();
    $event.returnValue = false;
    this.progressService.activate();
    await this.controllerManagement.stopAll();
    this.shouldStopControllersOnClosing = false;
    this.progressService.deactivate();
    window.close();
    return false;
  }

  ngOnDestroy() {
    this.controllerStatusSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }
}
