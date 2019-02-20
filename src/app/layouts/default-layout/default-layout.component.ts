import { ElectronService } from 'ngx-electron';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';

@Component({
  selector: 'app-default-layout',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.css']
})
export class DefaultLayoutComponent implements OnInit {
  public isInstalledSoftwareAvailable = false;

  recentlyOpenedServerId : string;
  recentlyOpenedProjectId : string;

  constructor(
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService
  ) {}

  ngOnInit() {
    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;

    this.recentlyOpenedServerId = this.recentlyOpenedProjectService.getServerId();
    this.recentlyOpenedProjectId = this.recentlyOpenedProjectService.getProjectId();
  }
}
