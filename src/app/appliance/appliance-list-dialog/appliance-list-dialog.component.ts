import {Component, ElementRef, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {DataSource} from "@angular/cdk/collections";
import {Observable} from "rxjs/Observable";
import {Appliance} from "../../shared/models/appliance";
import {ApplianceService} from "../../shared/services/appliance.service";
import {Server} from "../../shared/models/server";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';


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

    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
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

    return Observable.merge(...displayDataChanges).map(() => {
      return this.applianceDatabase.data.slice().filter((item: Appliance) => {
        const searchStr = (item.name).toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });
    });
  }

  disconnect() {}

}
