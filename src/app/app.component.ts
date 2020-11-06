import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ElectronService } from 'ngx-electron';
import { SettingsService } from './services/settings.service';
import { ThemeService } from './services/theme.service';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ProgressService } from './common/progress/progress.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
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

  ngOnInit(): void {
    if (this.electronService.isElectronApp) {
      this.settingsService.subscribe(settings => {
        this.electronService.ipcRenderer.send('settings.changed', settings);
      });
    }
    let theme = localStorage.getItem('theme');
    if (theme === 'light') {
      this.themeService.setDarkMode(false);
    } else {
      this.themeService.setDarkMode(true);
    }
  }

  checkEvent(routerEvent) : void {
    if (routerEvent instanceof NavigationStart) {
      this.progressService.activate();
    }
 
    else if (routerEvent instanceof NavigationEnd ||
             routerEvent instanceof NavigationCancel ||
             routerEvent instanceof NavigationError) {
      this.progressService.deactivate();
    }
  }
}
