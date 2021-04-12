import { Component, HostBinding, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ElectronService } from 'ngx-electron';
import { SettingsService } from './services/settings.service';
import { ThemeService } from './services/theme.service';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ProgressService } from './common/progress/progress.service';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public darkThemeEnabled: boolean = false;

  constructor(
    private overlayContainer: OverlayContainer,
    iconReg: MatIconRegistry,
    sanitizer: DomSanitizer,
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private themeService: ThemeService,
    private router: Router,
    private progressService: ProgressService
  ) {
    iconReg.addSvgIcon('gns3', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
    iconReg.addSvgIcon('gns3black', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon_black.svg'));

    router.events.subscribe((value) => {
      this.checkEvent(value);
    });
  }

  @HostBinding('class') componentCssClass;

  ngOnInit(): void {
    if (this.electronService.isElectronApp) {
      this.settingsService.subscribe((settings) => {
        this.electronService.ipcRenderer.send('settings.changed', settings);
      });
    }

    this.applyTheme(this.themeService.savedTheme + '-theme');
    this.themeService.themeChanged.subscribe((event: string) => {
      this.applyTheme(event);
    });
  }

  applyTheme(theme: string) {
    if (theme === 'dark-theme') {
      this.darkThemeEnabled = true;
    } else {
      this.darkThemeEnabled = false;
    }
    this.overlayContainer.getContainerElement().classList.add(theme);
    this.componentCssClass = theme;
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
