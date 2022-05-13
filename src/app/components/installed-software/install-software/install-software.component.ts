import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-install-software',
  templateUrl: './install-software.component.html',
  styleUrls: ['./install-software.component.scss'],
})
export class InstallSoftwareComponent implements OnInit, OnDestroy, OnChanges {
  @Input('software')
  software: any;

  @Output()
  installedChanged = new EventEmitter();

  public disabled = false;
  public readyToInstall = true;
  public buttonText: string;

  constructor(private electronService: ElectronService) { }

  ngOnInit() {
    if (this.electronService && this.electronService.ipcRenderer) {
      this.electronService.ipcRenderer.on(this.responseChannel, (event, data) => {
        this.updateButton();
        this.installedChanged.emit(data);
      });
    }
  }

  ngOnDestroy() {
    if (this.electronService && this.electronService.ipcRenderer) {
      this.electronService.ipcRenderer.removeAllListeners(this.responseChannel);
    }
  }

  ngOnChanges() {
    this.updateButton();
  }

  install() {
    this.disabled = true;
    this.buttonText = 'Installing';
    this.electronService.ipcRenderer.send('installed-software-install', this.software);
  }

  private get responseChannel() {
    return `installed-software-installed-${this.software.name}`;
  }

  private updateButton() {
    this.disabled = this.software.installed;

    if (this.software.installed) {
      this.buttonText = 'Installed';
    } else {
      this.buttonText = 'Install';
    }
  }
}
