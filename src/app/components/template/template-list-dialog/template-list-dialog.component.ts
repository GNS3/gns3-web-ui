import { DataSource } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  inject,
  model,
  signal,
} from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
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
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { Compute } from '@models/compute';
import { TemplateService } from '@services/template.service';
import { ComputeService } from '@services/compute.service';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../validators/non-negative-validator';
export interface TemplateListDialogData {
  controller: Controller;
  project: Project;
  symbolUrls?: ReadonlyMap<string, string>;
  allowTopologyDrop: boolean;
}

export interface TemplateDragStartRequest {
  event: DragEvent;
  template: Template;
  numberOfNodes: number;
  computeId?: string;
}

type TemplateViewMode = 'grid' | 'list';

const VIEW_MODE_STORAGE_KEY = 'addNodesViewMode';

@Component({
  standalone: true,
  selector: 'app-template-list-dialog',
  templateUrl: './template-list-dialog.component.html',
  styleUrls: ['./template-list-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    DragDropModule,
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
  private destroyRef = inject(DestroyRef);

  @Output() nodeAddRequested = new EventEmitter<NodeAddedEvent>();
  @Output() templateDragStarted = new EventEmitter<TemplateDragStartRequest>();

  controller: Controller;
  project: Project;
  templateTypes: string[] = [
    'all',
    'cloud',
    'ethernet_hub',
    'ethernet_switch',
    'docker',
    'dynamips',
    'vpcs',
    'iou',
    'qemu',
  ];
  configurationForm: UntypedFormGroup;
  positionForm: UntypedFormGroup;
  templates: Template[] = [];
  filteredTemplates: Template[] = [];
  nodeComputes: { display: string; value: string }[] = [{ display: 'local', value: 'local' }];

  // Model signals for two-way binding
  searchText = model('');
  selectedType = model('all');
  selectedTemplate = model<Template | null>(null);
  selectedComputeId = model('local');

  /** Template gallery layout, persisted across dialog openings. */
  readonly viewMode = signal<TemplateViewMode>(localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'list' ? 'list' : 'grid');

  toggleViewMode(): void {
    const next: TemplateViewMode = this.viewMode() === 'grid' ? 'list' : 'grid';
    this.viewMode.set(next);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: TemplateListDialogData) {
    this.controller = data.controller;
    this.project = data.project;
    this.configurationForm = this.formBuilder.group({
      numberOfNodes: new UntypedFormControl(1, [
        Validators.compose([Validators.required, Validators.min(1), this.nonNegativeValidator.get]),
      ]),
    });
    this.positionForm = this.formBuilder.group({
      top: new UntypedFormControl(0, Validators.required),
      left: new UntypedFormControl(0, Validators.required),
    });
  }

  ngOnInit() {
    this.templateService
      .list(this.controller)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (listOfTemplates: Template[]) => {
          this.templates = [...listOfTemplates].sort((a, b) => a.name.localeCompare(b.name));
          this.filteredTemplates = [...this.templates];
          this.cd.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load templates';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });

    this.templateService.newTemplateCreated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newTemplate: Template) => {
        this.templates = [...this.templates, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
        this.filterTemplates();
        this.cd.markForCheck();
      });

    this.computeService
      .getComputes(this.controller)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (computes: Compute[]) => {
          const remoteComputes = computes
            .filter((c) => c.compute_id !== 'local')
            .map((c) => {
              const shortId = c.compute_id.slice(-8);
              return {
                display: `${c.name || c.compute_id} (${shortId})`,
                value: c.compute_id,
              };
            });
          this.nodeComputes = [{ display: 'local', value: 'local' }, ...remoteComputes];
          this.cd.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load computes';
          this.toasterService.error(message);
          this.nodeComputes = [{ display: 'local', value: 'local' }];
          this.cd.markForCheck();
        },
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  compareComputes(a: string, b: string): boolean {
    return a === b;
  }

  selectTemplate(template: Template): void {
    this.selectedTemplate.set(template);
    if (template.compute_id && this.nodeComputes.some((compute) => compute.value === template.compute_id)) {
      this.selectedComputeId.set(template.compute_id);
    }
  }

  onTemplatePointerDown(_event: MouseEvent, template: Template): void {
    this.selectTemplate(template);
  }

  onTemplateDragStart(event: DragEvent, template: Template): void {
    this.selectTemplate(template);
    if (!this.configurationForm.valid || !this.data.allowTopologyDrop) {
      event.preventDefault();
      return;
    }

    event.dataTransfer?.setData('text/plain', template.template_id ?? template.name);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      const image = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>(
        '.template-card__image-wrap'
      );
      if (image) {
        const imageRect = image.getBoundingClientRect();
        event.dataTransfer.setDragImage(image, imageRect.width / 2, imageRect.height / 2);
      }
    }

    this.templateDragStarted.emit({
      event,
      template,
      numberOfNodes: this.configurationForm.get('numberOfNodes').value,
      computeId: this.selectedComputeId(),
    });
  }

  refreshSymbolImages(): void {
    this.cd.markForCheck();
  }

  getImageSourceForTemplate(template: Template): string {
    return this.data.symbolUrls?.get(template.symbol) ?? '';
  }

  formatTemplateType(type: string): string {
    if (type === 'all') {
      return 'All template types';
    }
    return type.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  filterTemplates() {
    let temporaryTemplates = this.templates.filter((item) => {
      return item.name.toLowerCase().includes(this.searchText().toLowerCase());
    });
    if (this.selectedType() === '' || this.selectedType() === 'all') {
      this.filteredTemplates = temporaryTemplates;
    } else {
      this.filteredTemplates = temporaryTemplates.filter((t) => t.template_type === this.selectedType());
    }
    this.filteredTemplates.sort((a, b) => a.name.localeCompare(b.name));
  }

  onAddClick(): void {
    if (!this.selectedTemplate() || this.filteredTemplates.length === 0) {
      this.toasterService.error('Please firstly choose template.');
    } else if (!this.positionForm.valid || !this.configurationForm.valid || !this.selectedComputeId()) {
      this.toasterService.error('Please fill all required fields.');
    } else {
      const x: number = this.positionForm.get('left').value;
      const y: number = this.positionForm.get('top').value;
      if (
        x > this.project.scene_width / 2 ||
        x < -(this.project.scene_width / 2) ||
        y > this.project.scene_height / 2 ||
        y < -this.project.scene_height
      ) {
        this.toasterService.error('Please set correct position values.');
      } else {
        const nodeAddedEvent: NodeAddedEvent = {
          template: this.selectedTemplate(),
          computeId: this.selectedComputeId(),
          numberOfNodes: this.configurationForm.get('numberOfNodes').value,
          x: x,
          y: y,
        };
        this.nodeAddRequested.emit(nodeAddedEvent);
      }
    }
  }
}

export interface NodeAddedEvent {
  template: Template;
  computeId: string;
  name?: string;
  numberOfNodes: number;
  x: number;
  y: number;
  creationId?: string;
}

export class TemplateDatabase {
  dataChange: BehaviorSubject<Template[]> = new BehaviorSubject<Template[]>([]);

  get data(): Template[] {
    return this.dataChange.value;
  }

  constructor(private controller: Controller, private templateService: TemplateService) {
    this.templateService.list(this.controller).subscribe({
      next: (templates) => {
        this.dataChange.next(templates);
      },
      error: () => {
        this.dataChange.next([]);
      },
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
