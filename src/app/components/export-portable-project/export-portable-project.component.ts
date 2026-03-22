import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
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
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';

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
    MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPortableProjectComponent implements OnInit {
  export_project_form: UntypedFormGroup;
  chosenImage: string = '';
  compression_methods: any = [];
  compression_level: any = [];
  compression_filter_value: any = [];
  controller: Controller;
  project: Project;
  index: number = 4;
  fileName: string;
  readonly isExport = signal(false);

  public dialogRef = inject(MatDialogRef<ExportPortableProjectComponent>);
  @Inject(MAT_DIALOG_DATA) public data: any;
  private projectService = inject(ProjectService);
  private _fb = inject(UntypedFormBuilder);

  constructor() {}

  async ngOnInit() {
    this.controller = this.data.controllerDetails;
    this.project = this.data.projectDetails;
    if( this.project){
      this.fileName = this.project.name + '.gns3project';
    }
    await this.formControls();
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
    this.export_project_form.valueChanges.subscribe(() => {});
  }

  selectCompression(event) {
    if (this.compression_level.length > 0) {
      this.compression_level.map((_) => {
        if (event.value.value === _.name) {
          this.export_project_form.get('compression_level').setValue(_.value);
          this.compression_filter_value = _.selectionValues;
        }
      });
    }
  }

  exportPortableProject() {
    this.isExport.set(true);
    this.export_project_form.value.compression = this.export_project_form.value.compression.value ?? 'zstd';
     window.location.assign(this.projectService.getexportPortableProjectPath(this.controller, this.project.project_id, this.export_project_form.value))
     this.dialogRef.close();
  }
}
