import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { DataSource } from "@angular/cdk/collections";

import { Observable, BehaviorSubject, fromEvent, merge } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from "rxjs/operators";

import { Server } from "../../../models/server";
import { ApplianceService } from "../../../services/appliance.service";
import { Appliance } from "../../../models/appliance";


@Component({
  selector: 'app-appliance-list-dialog',
  templateUrl: './appliance-list-dialog.component.html',
  styleUrls: ['./appliance-list-dialog.component.scss']
})
export class ApplianceListDialogComponent implements OnInit {
  server: Server;
  applianceDatabase: ApplianceDatabase;
  dataSource: ApplianceDataSource;
  displayedColumns = ['name'];

  @ViewChild('filter') filter: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<ApplianceListDialogComponent>,
    private applianceService: ApplianceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.server = data['server'];
  }

  ngOnInit() {
    this.applianceDatabase = new ApplianceDatabase(this.server, this.applianceService);
    this.dataSource = new ApplianceDataSource(this.applianceDatabase);

    fromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged()
    )
    .subscribe(() => {
      if (!this.dataSource) { return; }
      this.dataSource.filter = this.filter.nativeElement.value;
    });

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addNode(appliance: Appliance): void {
    this.dialogRef.close(appliance);
  }

}


export class ApplianceDatabase {
  dataChange: BehaviorSubject<Appliance[]> = new BehaviorSubject<Appliance[]>([]);

  get data(): Appliance[] {
    return this.dataChange.value;
  }

  constructor(private server: Server, private applianceService: ApplianceService) {
    this.applianceService
      .list(this.server)
      .subscribe((appliances) => {
        this.dataChange.next(appliances);
      });
  }

};

export class ApplianceDataSource extends DataSource<Appliance> {
  filterChange = new BehaviorSubject('');

  get filter(): string { return this.filterChange.value; }
  set filter(filter: string) { this.filterChange.next(filter); }

  constructor(private applianceDatabase: ApplianceDatabase) {
    super();
  }

  connect(): Observable<Appliance[]> {
    const displayDataChanges = [
      this.applianceDatabase.dataChange,
      this.filterChange,
    ];

    return merge(...displayDataChanges).pipe(map(() => {
      return this.applianceDatabase.data.slice().filter((item: Appliance) => {
        const searchStr = (item.name).toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });
    }));
  }

  disconnect() {}

}
