import { DataSource } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { Compute } from '@models/compute';
import { TemplateService } from '@services/template.service';
import { ComputeService } from '@services/compute.service';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../validators/non-negative-validator';
import { TemplateFilter } from '@filters/templateFilter.pipe';

@Component({
  standalone: true,
  selector: 'app-template-list-dialog',
  templateUrl: './template-list-dialog.component.html',
  styleUrls: ['./template-list-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TemplateFilter,
  ],
})
export class TemplateListDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TemplateListDialogComponent>);
  private templateService = inject(TemplateService);
  private computeService = inject(ComputeService);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private nonNegativeValidator = inject(NonNegativeValidator);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  templateTypes: string[] = [
    'cloud',
    'ethernet_hub',
    'ethernet_switch',
    'docker',
    'dynamips',
    'vpcs',
    'virtualbox',
    'vmware',
    'iou',
    'qemu',
  ];
  selectedType: string;
  configurationForm: UntypedFormGroup;
  positionForm: UntypedFormGroup;
  templates: Template[] = [];
  filteredTemplates: Template[] = [];
  selectedTemplate: Template;
  searchText: string = '';

  nodeControllers: { display: string; value: string }[] = [{ display: 'local', value: 'local' }];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.controller = data['controller'];
    this.project = data['project'];
    this.configurationForm = this.formBuilder.group({
      numberOfNodes: new UntypedFormControl(1, [
        Validators.compose([Validators.required, this.nonNegativeValidator.get]),
      ]),
    });
    this.positionForm = this.formBuilder.group({
      top: new UntypedFormControl(0, Validators.required),
      left: new UntypedFormControl(0, Validators.required),
    });
  }

  ngOnInit() {
    this.templateService.list(this.controller).subscribe((listOfTemplates: Template[]) => {
      this.filteredTemplates = listOfTemplates;
      this.templates = listOfTemplates;
      this.cd.markForCheck();
    });

    // Load computes list for node controller selection
    this.computeService.getComputes(this.controller).subscribe({
      next: (computes: Compute[]) => {
        // Add remote computes to nodeControllers (skip 'local' as it's already included)
        const remoteComputes = computes
          .filter((c) => c.compute_id !== 'local')
          .map((c) => {
            const shortId = c.compute_id.slice(-8);
            return {
              display: `${c.name || c.compute_id} (${shortId})`,
              value: c.compute_id, // Full UUID as actual value
            };
          });
        this.nodeControllers = [{ display: 'local', value: 'local' }, ...remoteComputes];
        this.cd.markForCheck();
      },
      error: () => {
        // Fallback to local only if fails
        this.nodeControllers = [{ display: 'local', value: 'local' }];
        this.cd.markForCheck();
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  compareControllers(a: string, b: string): boolean {
    return a === b;
  }

  filterTemplates(event) {
    let temporaryTemplates = this.templates.filter((item) => {
      return item.name.toLowerCase().includes(this.searchText.toLowerCase());
    });
    this.filteredTemplates = temporaryTemplates.filter((t) => t.template_type === event.value.toString());
  }

  chooseTemplate(event) {
    this.selectedTemplate = event.value;
    if (
      this.selectedTemplate.template_type === 'cloud' ||
      this.selectedTemplate.template_type === 'ethernet_hub' ||
      this.selectedTemplate.template_type === 'ethernet_switch'
    ) {
      this.selectedTemplate.compute_id = 'local';
    }
    // this.configurationForm.controls['name'].setValue(this.selectedTemplate.default_name_format);
  }

  onAddClick(): void {
    if (!this.selectedTemplate || this.filteredTemplates.length === 0) {
      this.toasterService.error('Please firstly choose template.');
    } else if (!this.positionForm.valid || !this.configurationForm.valid || !this.selectedTemplate.compute_id) {
      this.toasterService.error('Please fill all required fields.');
    } else {
      let x: number = this.positionForm.get('left').value;
      let y: number = this.positionForm.get('top').value;
      if (
        x > this.project.scene_width / 2 ||
        x < -(this.project.scene_width / 2) ||
        y > this.project.scene_height / 2 ||
        y < -this.project.scene_height
      ) {
        this.toasterService.error('Please set correct position values.');
      } else {
        let event: NodeAddedEvent = {
          template: this.selectedTemplate,
          controller: this.selectedTemplate.compute_id,
          // name: this.configurationForm.get('name').value,
          numberOfNodes: this.configurationForm.get('numberOfNodes').value,
          x: x,
          y: y,
        };
        this.dialogRef.close(event);
      }
    }
  }
}

export interface NodeAddedEvent {
  template: Template;
  controller: string;
  name?: string;
  numberOfNodes: number;
  x: number;
  y: number;
}

export class TemplateDatabase {
  dataChange: BehaviorSubject<Template[]> = new BehaviorSubject<Template[]>([]);

  get data(): Template[] {
    return this.dataChange.value;
  }

  constructor(private controller: Controller, private templateService: TemplateService) {
    this.templateService.list(this.controller).subscribe((templates) => {
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
