import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { InstalledSoftwareService } from '@services/installed-software.service';
import { AdbutlerComponent } from '@components/adbutler/adbutler.component';
import { InstallSoftwareComponent } from './install-software/install-software.component';

@Component({
  selector: 'app-installed-software',
  templateUrl: './installed-software.component.html',
  styleUrl: './installed-software.component.scss',
  imports: [CommonModule, MatTableModule, AdbutlerComponent, InstallSoftwareComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalledSoftwareComponent implements OnInit {
  readonly dataSource = signal<InstalledSoftwareDataSource | null>(null);
  readonly displayedColumns = signal(['name', 'actions']);

  private installedSoftwareService = inject(InstalledSoftwareService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit() {
    this.dataSource.set(new InstalledSoftwareDataSource(this.installedSoftwareService));
  }

  onInstalled(event) {
    this.dataSource()?.refresh();
    /**
     * During software installation we are not performing any user action
     * in browser hence Angular doesn't know something suppose to change.
     * Here we ask to detect changes manually.
     */
    this.changeDetectorRef.detectChanges();
  }
}

export class InstalledSoftwareDataSource extends DataSource<any> {
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
    let installedSoftware = this.installedSoftwareService.list();
    installedSoftware.push({
      type: 'adbutler',
    });
    this.installed.next(installedSoftware);
  }
}
