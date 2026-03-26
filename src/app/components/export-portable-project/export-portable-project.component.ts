import { ChangeDetectionStrategy, Component, DestroyRef, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';

interface CompressionMethod {
  id: number;
  value: string;
  name: string;
}

interface CompressionLevel {
  id: number;
  name: string;
  value: number | string;
  selectionValues: (number | string)[];
}

interface ExportDialogData {
  controllerDetails: Controller;
  projectDetails: Project;
}

interface SelectCompressionEvent {
  value: CompressionMethod;
}

@Component({
  selector: 'app-export-portable-project',
  templateUrl: './export-portable-project.component.html',
  styleUrl: './export-portable-project.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPortableProjectComponent implements OnInit {
  export_project_form: UntypedFormGroup;
  chosenImage: string = '';
  compression_methods: CompressionMethod[] = [];
  compression_level: CompressionLevel[] = [];
  compression_filter_value: (number | string)[] = [];
  controller: Controller;
  project: Project;
  index: number = 4;
  fileName: string;
  readonly isExport = signal(false);

  public dialogRef = inject(MatDialogRef<ExportPortableProjectComponent>);
  private projectService = inject(ProjectService);
  private _fb = inject(UntypedFormBuilder);
  private destroyRef = inject(DestroyRef);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ExportDialogData) {
    this.controller = data.controllerDetails;
    this.project = data.projectDetails;
    if (this.project) {
      this.fileName = this.project.name + '.gns3project';
    }
  }

  ngOnInit() {
    this.formControls();
    this.compression_methods = this.projectService.getCompression();
    this.compression_level = this.projectService.getCompressionLevel();
    this.selectCompression({ value: this.compression_methods[this.index] });
    this.export_project_form.get('compression').setValue(this.compression_methods[this.index]);
  }

  formControls() {
    this.export_project_form = this._fb.group({
      compression: ['', Validators.required],
      compression_level: [''],
      include_base_image: [false, Validators.required],
      include_snapshots: [false, Validators.required],
      reset_mac_address: [false, Validators.required],
    });
  }

  selectCompression(event: SelectCompressionEvent) {
    const level = this.compression_level.find((item) => event.value.value === item.name);
    if (level) {
      this.export_project_form.get('compression_level').setValue(level.value);
      this.compression_filter_value = level.selectionValues;
    }
  }

  exportPortableProject() {
    this.isExport.set(true);
    const formValue = this.export_project_form.value;
    const compressionValue =
      typeof formValue.compression === 'object' ? formValue.compression.value : formValue.compression;
    const exportData = {
      ...formValue,
      compression: compressionValue ?? 'zstd',
    };
    window.location.assign(
      this.projectService.getexportPortableProjectPath(this.controller, this.project.project_id, exportData)
    );
    this.dialogRef.close();
  }
}
