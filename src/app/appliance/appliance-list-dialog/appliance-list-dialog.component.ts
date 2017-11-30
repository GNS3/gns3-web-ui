import {Component, Inject, Input, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {DataSource} from "@angular/cdk/collections";
import {Observable} from "rxjs/Observable";
import {Appliance} from "../../shared/models/appliance";
import {ApplianceService} from "../../shared/services/appliance.service";
import {Server} from "../../shared/models/server";


@Component({
  selector: 'app-appliance-list-dialog',
  templateUrl: './appliance-list-dialog.component.html',
  styleUrls: ['./appliance-list-dialog.component.scss']
})
export class ApplianceListDialogComponent implements OnInit {
  server: Server;
  dataSource: ApplianceDataSource;
  displayedColumns = ['name'];

  constructor(
    public dialogRef: MatDialogRef<ApplianceListDialogComponent>,
    private applianceService: ApplianceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.server = data['server'];
  }

  ngOnInit() {
    this.dataSource = new ApplianceDataSource(this.server, this.applianceService);
  }

  onAddClick(): void {
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}


export class ApplianceDataSource extends DataSource<Appliance> {
  constructor(private server: Server, private applianceService: ApplianceService) {
    super();
  }

  connect(): Observable<Appliance[]> {
    return this.applianceService.list(this.server);
  }

  disconnect() {}

}
