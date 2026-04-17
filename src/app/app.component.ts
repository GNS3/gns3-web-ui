import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { ProgressService } from './common/progress/progress.service';
import { SettingsService } from '@services/settings.service';
import { ThemeService } from '@services/theme.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GlobalUploadIndicatorComponent } from './components/global-upload-indicator/global-upload-indicator.component';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { ControllerService } from '@services/controller.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, RouterModule, GlobalUploadIndicatorComponent],
  host: {
    class: 'componentCssClass',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private overlayContainer = inject(OverlayContainer);
  private iconReg = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private connectionManager = inject(ConnectionManagerService);
  private controllerService = inject(ControllerService);

  constructor() {
    this.iconReg.addSvgIcon('gns3', this.sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
    this.iconReg.addSvgIcon('gns3black', this.sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon_black.svg'));
    this.iconReg.addSvgIcon('github', this.sanitizer.bypassSecurityTrustResourceUrl('./assets/github-icon.svg'));

    this.router.events.subscribe((value) => {
      this.checkEvent(value);
    });
  }

  ngOnInit(): void {
    this.themeService.themeChanged.subscribe((theme: string) => {
      this.applyTheme(theme);
    });

    // Check for auto-login and establish WebSocket connection
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkAndEstablishConnection(event.url);
    });
  }

  /**
   * Check if user is auto-logged in and establish WebSocket connection
   */
  private async checkAndEstablishConnection(url: string) {
    // Extract controller_id from URL
    const controllerIdMatch = url.match(/\/controller\/(\d+)/);
    if (!controllerIdMatch) return;

    const controllerId = parseInt(controllerIdMatch[1], 10);

    try {
      const controller = await this.controllerService.get(controllerId);

      // If controller has auth token, user is logged in - establish connection
      if (controller && controller.authToken) {
        this.connectionManager.establishConnection(controller);
      }
    } catch (error) {
      console.error('Failed to check controller for auto-login:', error);
    }
  }

  applyTheme(theme: string) {
    const classList = this.overlayContainer.getContainerElement().classList;
    classList.remove(
      'theme-deeppurple-amber',
      'theme-indigo-pink',
      'theme-magenta-violet',
      'theme-rose-red',
      'theme-pink-bluegrey',
      'theme-purple-green',
      'theme-azure-blue',
      'theme-cyan-orange'
    );
    classList.add(`theme-${theme}`);
  }

  checkEvent(routerEvent): void {
    if (routerEvent instanceof NavigationStart) {
      this.progressService.activate();
    } else if (
      routerEvent instanceof NavigationEnd ||
      routerEvent instanceof NavigationCancel ||
      routerEvent instanceof NavigationError
    ) {
      this.progressService.deactivate();
    }
  }
}
