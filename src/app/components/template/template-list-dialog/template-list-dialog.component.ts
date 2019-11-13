import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';

import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { Server } from '../../../models/server';
import { TemplateService } from '../../../services/template.service';
import { Template } from '../../../models/template';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

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
  templateTypes: string[] = ['cloud', 'ethernet_hub', 'ethernet_switch', 'docker', 'dynamips', 'vpcs', 'traceng', 'virtualbox', 'vmware', 'iou', 'qemu'];
  selectedType: string;
  configurationForm: FormGroup;
  positionForm: FormGroup;
  templates: Template[];
  searchText: string;

  @ViewChild('filter', {static: true}) filter: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<TemplateListDialogComponent>,
    private templateService: TemplateService,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.server = data['server'];
    this.configurationForm = this.formBuilder.group({
      name: new FormControl('new node', Validators.required),
      numberOfNodes: new FormControl(1, Validators.required)
    });
    this.positionForm = this.formBuilder.group({
      top: new FormControl(0, Validators.required),
      left: new FormControl(0, Validators.required)
    });
  }

  ngOnInit() {
    // this.templateDatabase = new TemplateDatabase(this.server, this.templateService);
    // this.dataSource = new TemplateDataSource(this.templateDatabase);

    this.templateService.list(this.server).subscribe((listOfTemplates: Template[]) => {
      this.templates = listOfTemplates;
    });

    // fromEvent(this.filter.nativeElement, 'keyup')
    //   .pipe(
    //     debounceTime(150),
    //     distinctUntilChanged()
    //   )
    //   .subscribe(() => {
    //     if (!this.dataSource) {
    //       return;
    //     }
    //     this.dataSource.filter = this.filter.nativeElement.value;
    //   });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addNode(template: Template): void {
    this.dialogRef.close(template);
  }

  filterTemplates(event) {
    console.log('filter event ', event);
  }

  chooseTemplate(event) {
    console.log('choose event ', event);
  }

  onAddClick(): void {
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
