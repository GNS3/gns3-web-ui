import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';

import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { Server } from '../../../models/server';
import { TemplateService } from '../../../services/template.service';
import { Template } from '../../../models/template';

@Component({
  selector: 'app-template-list-dialog',
  templateUrl: './template-list-dialog.component.html',
  styleUrls: ['./template-list-dialog.component.scss']
})
export class TemplateListDialogComponent implements OnInit {
  server: Server;
  templateDatabase: TemplateDatabase;
  dataSource: TemplateDataSource;
  displayedColumns = ['name'];

  @ViewChild('filter') filter: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<TemplateListDialogComponent>,
    private templateService: TemplateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.server = data['server'];
  }

  ngOnInit() {
    this.templateDatabase = new TemplateDatabase(this.server, this.templateService);
    this.dataSource = new TemplateDataSource(this.templateDatabase);

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addNode(template: Template): void {
    this.dialogRef.close(template);
  }
}

export class TemplateDatabase {
  dataChange: BehaviorSubject<Template[]> = new BehaviorSubject<Template[]>([]);

  get data(): Template[] {
    return this.dataChange.value;
  }

  constructor(private server: Server, private templateService: TemplateService) {
    this.templateService.list(this.server).subscribe(templates => {
      this.dataChange.next(templates);
    });
  }
}

export class TemplateDataSource extends DataSource<Template> {
  filterChange = new BehaviorSubject('');

  get filter(): string {
    return this.filterChange.value;
  }
  set filter(filter: string) {
    this.filterChange.next(filter);
  }

  constructor(private templateDatabase: TemplateDatabase) {
    super();
  }

  connect(): Observable<Template[]> {
    const displayDataChanges = [this.templateDatabase.dataChange, this.filterChange];

    return merge(...displayDataChanges).pipe(
      map(() => {
        return this.templateDatabase.data.slice().filter((item: Template) => {
          const searchStr = item.name.toLowerCase();
          return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
        });
      })
    );
  }

  disconnect() {}
}
