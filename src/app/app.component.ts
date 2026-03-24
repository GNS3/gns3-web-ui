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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    GlobalUploadIndicatorComponent,
  ],
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
  }

  applyTheme(theme: string) {
    const classList = this.overlayContainer.getContainerElement().classList;
    classList.remove('theme-deeppurple-amber', 'theme-indigo-pink', 'theme-pink-bluegrey', 'theme-purple-green');
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
