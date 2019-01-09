import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-default-layout',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.css']
})
export class DefaultLayoutComponent implements OnInit {
  public isInstalledSoftwareAvailable = false;

  constructor(
    private electronService: ElectronService
  ) { }

  ngOnInit() {
    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;
  }

}
