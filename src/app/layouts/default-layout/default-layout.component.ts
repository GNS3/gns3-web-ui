import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ProjectService } from '@services/project.service';
import { filter, Subscription } from 'rxjs';
import { ProgressService } from '../../common/progress/progress.service';
import { NewTemplateDialogComponent } from '@components/project-map/new-template-dialog/new-template-dialog.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ControllerManagementService } from '@services/controller-management.service';
import { ControllerService } from '@services/controller.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressComponent } from '../../common/progress/progress.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-layout',
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    ProgressComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public isInstalledSoftwareAvailable = false;
  public isLoginPage = false;
  public routeSubscription;

  controllerStatusSubscription: Subscription;
  shouldStopControllersOnClosing = true;
  recentlyOpenedcontrollerId: string;
  recentlyOpenedProjectId: string;
  controllerIdProjectList: string;
  controllerId: string | undefined | null;
  public controller: Controller;
  public project: Project;
  private projectMapSubscription: Subscription = new Subscription();

  private recentlyOpenedProjectService = inject(RecentlyOpenedProjectService);
  private controllerManagement = inject(ControllerManagementService);
  private toasterService = inject(ToasterService);
  private progressService = inject(ProgressService);
  private dialog = inject(MatDialog);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private projectService = inject(ProjectService);
  private cd = inject(ChangeDetectorRef);

  ngOnInit() {
    // Use filter and proper subscription for NavigationEnd
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        // Recursively traverse the route tree to find controller_id
        this.controllerId = this.getParamFromRoute(this.route, 'controller_id');
        this.getData();
        this.checkIfUserIsLoginPage();
        this.cd.markForCheck();
      });

    // Initial load
    this.controllerId = this.getParamFromRoute(this.route, 'controller_id');
    this.getData();

    this.recentlyOpenedcontrollerId = this.recentlyOpenedProjectService.getcontrollerId();
    this.recentlyOpenedProjectId = this.recentlyOpenedProjectService.getProjectId();
    this.controllerIdProjectList = this.recentlyOpenedProjectService.getcontrollerIdProjectList();

    this.isInstalledSoftwareAvailable = false; // Web application

    // attach to notification stream when any of running local controllers experienced issues
    this.controllerStatusSubscription = this.controllerManagement.controllerStatusChanged.subscribe(
      (controllerStatus) => {
        if (controllerStatus.status === 'errored') {
          console.error(controllerStatus.message);
          this.toasterService.error(controllerStatus.message);
        }
        if (controllerStatus.status === 'stderr') {
          console.error(controllerStatus.message);
          this.toasterService.error(controllerStatus.message);
        }
      }
    );

    // stop controllers only when in Electron (not applicable for web)
    this.shouldStopControllersOnClosing = false;
  }

  /**
   * Recursively traverse the route tree to find a parameter value.
   * This is more reliable than just checking children[0] because
   * the route structure may vary depending on which child routes are active.
   */
  private getParamFromRoute(route: ActivatedRoute, paramName: string): string | null {
    let child = route;
    // Traverse the entire route tree
    while (child.firstChild) {
      child = child.firstChild;
      // Check current level params
      const param = child.snapshot.paramMap.get(paramName);
      if (param) return param;
    }
    // If no param found in tree, check root params
    return child.snapshot.paramMap.get(paramName);
  }

  goToDocumentation() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      (window as any).open(`${controller.protocol}//${controller.host}:${controller.port}/docs`);
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
      this.controllerService
        .update(controller)
        .then((val) => this.router.navigate(['/controller', controller.id, 'login']));
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
  getData() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      this.controller = controller;
    });
  }

  public addNewTemplate() {
    const dialogRef = this.dialog.open(NewTemplateDialogComponent, {
      width: '1000px',
      maxHeight: '700px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
  }

  ngOnDestroy() {
    this.controllerStatusSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }
}
