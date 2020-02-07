import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { ElectronService } from 'ngx-electron';
import { SettingsService } from './services/settings.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    iconReg: MatIconRegistry,
    sanitizer: DomSanitizer,
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private themeService: ThemeService
  ) {
    iconReg.addSvgIcon('gns3', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
    iconReg.addSvgIcon('gns3black', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon_black.svg'));
  }

  ngOnInit(): void {
    if (this.electronService.isElectronApp) {
      this.settingsService.subscribe(settings => {
        this.electronService.ipcRenderer.send('settings.changed', settings);
      });
    }
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      this.themeService.setDarkMode(false);
    } else {
      this.themeService.setDarkMode(true);
    }
  }
}
