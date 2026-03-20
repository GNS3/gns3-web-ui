import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  standalone: false,
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

  constructor() {}

  ngOnInit() {
    this.updateButton();
  }

  ngOnDestroy() {}

  ngOnChanges() {
    this.updateButton();
  }

  install() {
    // Installation is not supported in web mode
    this.disabled = true;
    this.buttonText = 'Not supported';
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
