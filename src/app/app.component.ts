import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { ElectronService } from 'ngx-electron';
import { SettingsService } from './services/settings.service';

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
    private electronService: ElectronService
  ) {
    iconReg.addSvgIcon('gns3', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
  }

  ngOnInit(): void {
    if (this.electronService.isElectronApp) {
      this.settingsService.subscribe(settings => {
        this.electronService.ipcRenderer.send('settings.changed', settings);
      });
    }
  }
}
