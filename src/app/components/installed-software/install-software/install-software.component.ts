import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-install-software',
  templateUrl: './install-software.component.html',
  styleUrls: ['./install-software.component.scss']
})
export class InstallSoftwareComponent implements OnInit, OnDestroy {
  @Input('software')
  software: any;

  @Output()
  installedChanged = new EventEmitter();
  
  public disabled = false;
  public readyToInstall = true;
  public buttonText: string;

  constructor(
    private electronService: ElectronService
  ) { }

  ngOnInit() {
    this.electronService.ipcRenderer.on(this.responseChannel, (event, data) => {
      this.updateButton();
      this.installedChanged.emit(data);
    });
    this.updateButton();
  }

  ngOnDestroy() {
    this.electronService.ipcRenderer.removeAllListeners(this.responseChannel);
  }


  install() {
    this.disabled = true;
    this.buttonText = "Installing";
    this.electronService.ipcRenderer.send('installed-software-install', this.software);
  }

  private get responseChannel() {
    return `installed-software-installed-${this.software.name}`;
  }

  updateButton() {
    this.disabled = this.software.installed;

    if (this.software.installed) {
      this.buttonText = "Installed";
    }
    else {
      this.buttonText = "Install";
    }
  }
}
