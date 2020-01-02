import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Server } from '../../../models/server';
import { TemplateService } from '../../../services/template.service';
import { Template } from '../../../models/template';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToasterService } from '../../../services/toaster.service';
import { Project } from '../../../models/project';

@Component({
  selector: 'app-template-list-dialog',
  templateUrl: './template-list-dialog.component.html',
  styleUrls: ['./template-list-dialog.component.scss']
})
export class TemplateListDialogComponent implements OnInit {
  server: Server;
  project: Project;
  templateTypes: string[] = ['cloud', 'ethernet_hub', 'ethernet_switch', 'docker', 'dynamips', 'vpcs', 'traceng', 'virtualbox', 'vmware', 'iou', 'qemu'];
  selectedType: string;
  configurationForm: FormGroup;
  positionForm: FormGroup;
  templates: Template[];
  filteredTemplates: Template[];
  selectedTemplate: Template;
  searchText: string = '';

  constructor(
    public dialogRef: MatDialogRef<TemplateListDialogComponent>,
    private templateService: TemplateService,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toasterService: ToasterService
  ) {
    this.server = data['server'];
    this.project = data['project'];
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
    this.templateService.list(this.server).subscribe((listOfTemplates: Template[]) => {
      this.filteredTemplates = listOfTemplates;
      this.templates = listOfTemplates;
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  filterTemplates(event) {
    let temporaryTemplates = this.templates.filter( item => {
      return item.name.toLowerCase().includes(this.searchText.toLowerCase());
    });
    this.filteredTemplates = temporaryTemplates.filter(t => t.template_type === event.value.toString());
  }

  chooseTemplate(event) {
    this.selectedTemplate = event.value;
    this.configurationForm.controls['name'].setValue(this.selectedTemplate.default_name_format);
  }

  onAddClick(): void {
    if (!this.selectedTemplate || this.filteredTemplates.length === 0) {
      this.toasterService.error('Please firstly choose template.');
    } else if (!this.positionForm.valid || !this.configurationForm.valid) {
      this.toasterService.error('Please fill all required fields.');
    } else {
      let x: number = this.positionForm.get('left').value;
      let y: number = this.positionForm.get('top').value;
      if (x>(this.project.scene_width/2) || x<-(this.project.scene_width/2) || y>(this.project.scene_height/2) || y<-(this.project.scene_height)) {
        this.toasterService.error('Please set correct position values.')
      } else {
        let event: NodeAddedEvent = {
          template: this.selectedTemplate,
          name: this.configurationForm.get('name').value,
          numberOfNodes: this.configurationForm.get('numberOfNodes').value,
          x: x,
          y: y
        };
        this.dialogRef.close(event);
      }
    }
  }
}

export interface NodeAddedEvent {
  template: Template,
  name: string,
  numberOfNodes: number;
  x: number;
  y: number;
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
