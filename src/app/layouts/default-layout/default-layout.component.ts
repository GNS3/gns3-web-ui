import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ProgressService } from '../../common/progress/progress.service';
import { LoggedUserComponent } from '@components/users/logged-user/logged-user.component';
import { AiProfileDialogComponent } from '@components/user-management/ai-profile-dialog/ai-profile-dialog.component';
import {
  ApiKeyManagementDialogComponent,
  ApiKeyManagementDialogData,
} from '@components/api-key-management/api-key-management-dialog.component';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { ControllerManagementService } from '@services/controller-management.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { ProgressComponent } from '../../common/progress/progress.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationCenterComponent } from '@components/notification-center/notification-center.component';
import { NotificationCenterService } from '@services/notification-center.service';

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
    MatSidenavModule,
    MatListModule,
    ProgressComponent,
    NotificationCenterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public isInstalledSoftwareAvailable = false;
  private routeSubscription: Subscription;
  private breakpointSubscription: Subscription;

  controllerStatusSubscription: Subscription;
  shouldStopControllersOnClosing = true;
  controllerId: string | undefined | null;
  public controller: Controller;

  // Sidebar state
  readonly sidenavOpened = signal(true);
  readonly isSmallScreen = signal(false);
  readonly sidebarMode = signal<'side' | 'over'>('side');
  readonly isAdministrator = signal(false);

  private controllerManagement = inject(ControllerManagementService);
  private toasterService = inject(ToasterService);
  private userService = inject(UserService);
  private progressService = inject(ProgressService);
  private dialog = inject(MatDialog);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private cd = inject(ChangeDetectorRef);
  private connectionManager = inject(ConnectionManagerService);
  private breakpointObserver = inject(BreakpointObserver);
  readonly notificationCenter = inject(NotificationCenterService);

  ngOnInit() {
    this.notificationCenter.closePanel();
    // Use filter and proper subscription for NavigationEnd
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.notificationCenter.closePanel();
        // Recursively traverse the route tree to find controller_id
        const controllerId = this.getParamFromRoute(this.route, 'controller_id');
        // Only refetch (and reset controller/admin state) when the controller
        // actually changed; otherwise the sidebar @if blocks collapse and
        // re-expand on every navigation, making the Support section flicker.
        if (controllerId !== this.controllerId) {
          this.controllerId = controllerId;
          this.getData();
        }
        this.cd.markForCheck();
      });

    // Initial load
    this.controllerId = this.getParamFromRoute(this.route, 'controller_id');
    this.getData();

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

    // Responsive sidebar: observe small screen breakpoints
    this.breakpointSubscription = this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((state) => {
        const small = state.matches;
        this.isSmallScreen.set(small);
        if (small) {
          this.sidenavOpened.set(false);
          this.sidebarMode.set('over');
        } else {
          this.sidenavOpened.set(true);
          this.sidebarMode.set('side');
        }
        this.cd.markForCheck();
      });
  }

  toggleSidenav() {
    this.sidenavOpened.update((v) => !v);
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

  openLoggedUserDialog() {
    this.dialog.open(LoggedUserComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel'],
      autoFocus: false,
      data: { controllerId: +this.controllerId },
    });
  }

  openApiKeyManagementDialog() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      this.dialog.open(ApiKeyManagementDialogComponent, {
        panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'dialog-large-panel'],
        autoFocus: false,
        data: { controller } satisfies ApiKeyManagementDialogData,
      });
    });
  }

  openAiProfileDialog() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      this.userService.getInformationAboutLoggedUser(controller).subscribe((user) => {
        this.dialog.open(AiProfileDialogComponent, {
          panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'dialog-extra-large-panel'],
          autoFocus: false,
          data: { user, controller },
        });
      });
    });
  }

  goToDocumentation() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      (window as any).open(`${controller.protocol}//${controller.host}:${controller.port}/docs`);
    });
  }

  logout() {
    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      // Clear refresh token
      localStorage.removeItem(`refresh_token_${controller.id}`);

      controller.authToken = null;
      this.controllerService.update(controller).then((val) => {
        // Disconnect WebSocket connection on logout
        this.connectionManager.disconnect();
        this.router.navigate(['/controller', controller.id, 'login']);
      });
    });
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
    const requestedControllerId = this.controllerId;
    this.controller = undefined;
    this.isAdministrator.set(false);

    const numericControllerId = Number(requestedControllerId);
    if (!Number.isInteger(numericControllerId) || numericControllerId <= 0) {
      this.cd.markForCheck();
      return;
    }

    this.controllerService.get(numericControllerId).then(
      (controller: Controller) => {
        if (this.controllerId !== requestedControllerId) {
          return;
        }

        this.controller = controller;
        if (!controller) {
          this.cd.markForCheck();
          return;
        }
        this.userService.getInformationAboutLoggedUser(controller).subscribe({
          next: (user: User) => {
            if (this.controllerId !== requestedControllerId) {
              return;
            }
            this.isAdministrator.set(Boolean(user.is_superadmin));
            this.cd.markForCheck();
          },
          error: () => {
            if (this.controllerId !== requestedControllerId) {
              return;
            }
            this.isAdministrator.set(false);
            this.cd.markForCheck();
          },
        });
      },
      () => {
        if (this.controllerId !== requestedControllerId) {
          return;
        }
        this.controller = undefined;
        this.isAdministrator.set(false);
        this.cd.markForCheck();
      }
    );
  }

  ngOnDestroy() {
    this.controllerStatusSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }
}
