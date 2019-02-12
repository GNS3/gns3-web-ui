import { ElectronService } from 'ngx-electron';
import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ServerManagementService } from '../../services/server-management.service';
import { Subscription } from 'rxjs';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-default-layout',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.css']
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public isInstalledSoftwareAvailable = false;
  
  serverStatusSubscription: Subscription;

  constructor(
    private electronService: ElectronService,
    private serverManagement: ServerManagementService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.isInstalledSoftwareAvailable = this.electronService.isElectronApp;

    this.serverStatusSubscription = this.serverManagement.serverStatusChanged.subscribe((serverStatus) => {
      if(serverStatus.status === 'errored') {
        this.toasterService.error(serverStatus.message);
      }
    });

  }

  ngOnDestroy() {
    this.serverStatusSubscription.unsubscribe();
  }

}
