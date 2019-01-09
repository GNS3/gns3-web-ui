import { Component, OnInit } from '@angular/core';
import { InstalledSoftwareService } from '../../services/installed-software.service';
import { DataSource } from '@angular/cdk/table';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-installed-software',
  templateUrl: './installed-software.component.html',
  styleUrls: ['./installed-software.component.scss']
})
export class InstalledSoftwareComponent implements OnInit {
  dataSource: InstalledSoftwareDataSource;
  displayedColumns = ['name', 'actions'];

  constructor(
    private installedSoftwareService: InstalledSoftwareService
  ) { }

  ngOnInit() {
    this.dataSource = new InstalledSoftwareDataSource(this.installedSoftwareService);
  }

  install(software) {
    this.installedSoftwareService.install({
      type: 'web'
    });
  }
}

export class InstalledSoftwareDataSource extends DataSource<any> {
  constructor(private installedSoftwareService: InstalledSoftwareService) {
    super();
  }

  connect(): Observable<any[]> {
    const installed = this.installedSoftwareService.list();
    return of(installed);
  }

  disconnect() {}

}
