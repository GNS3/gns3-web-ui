import { DataSource } from '@angular/cdk/table';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { InstalledSoftwareService } from '../../services/installed-software.service';

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
    const installedSoftware = this.installedSoftwareService.list();
    installedSoftware.push({
      type: 'adbutler'
    });
    this.installed.next(installedSoftware);
  }

}
