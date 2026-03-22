import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  public darkThemeEnabled = signal<boolean>(false);

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

    this.router.events.subscribe((value) => {
      this.checkEvent(value);
    });
  }

  ngOnInit(): void {
    this.applyTheme(this.themeService.savedTheme + '-theme');
    this.themeService.themeChanged.subscribe((event: string) => {
      this.applyTheme(event);
    });
  }

  applyTheme(theme: string) {
    if (theme === 'dark-theme') {
      this.darkThemeEnabled.set(true);
    } else {
      this.darkThemeEnabled.set(false);
    }
    const classList = this.overlayContainer.getContainerElement().classList;
    classList.remove('dark-theme', 'light-theme', 'dark', 'light');
    classList.add(theme);
    classList.add(theme === 'dark-theme' ? 'dark' : 'light');
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
