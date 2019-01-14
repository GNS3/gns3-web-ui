import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { InstalledSoftwareService } from '../../services/installed-software.service';
import { DataSource } from '@angular/cdk/table';
import { Observable, of, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-installed-software',
  templateUrl: './installed-software.component.html',
  styleUrls: ['./installed-software.component.scss']
})
export class InstalledSoftwareComponent implements OnInit {
  dataSource: InstalledSoftwareDataSource;
  displayedColumns = ['name', 'actions'];

  constructor(
    private installedSoftwareService: InstalledSoftwareService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.dataSource = new InstalledSoftwareDataSource(this.installedSoftwareService);
  }

  onInstalled(event) {
    this.dataSource.refresh();
    console.log("On installed", event);
    /**
     * During software installation we are not performing any user action
     * in browser hence Angular doesn't know something suppose to change.
     * Here we ask to detect changes manually.
     */
    this.changeDetectorRef.detectChanges();
  }
}

export class InstalledSoftwareDataSource extends DataSource<any> {
  installed = new BehaviorSubject([]);

  constructor(private installedSoftwareService: InstalledSoftwareService) {
    super();
  }

  connect(): Observable<any[]> {
    this.refresh();
    return this.installed;
  }

  disconnect() {}

  refresh() {
    this.installed.next(this.installedSoftwareService.list());
  }

}
