import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-export-portable-project',
  templateUrl: './export-portable-project.component.html',
  styleUrls: ['./export-portable-project.component.scss'],
})
export class ExportPortableProjectComponent implements OnInit {
  export_project_form: FormGroup;
  chosenImage: string = '';
  compression_methods: any = [];
  compression_level: any = [];
  compression_filter_value: any = [];
  controller: Server;
  project: Project;
  index: number = 4;
  fileName: string;
  isExport: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ExportPortableProjectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private projectService: ProjectService,
    private _fb: FormBuilder
  ) {}

  async ngOnInit() {
    this.controller = this.data.serverDetails;
    this.project = this.data.projectDetails;
    this.fileName = this.project.name + '.gns3project';
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
    this.isExport = true;
    this.export_project_form.value.compression = this.export_project_form.value.compression.value ?? 'zstd';
     window.location.assign(this.projectService.getexportPortableProjectPath(this.controller, this.project.project_id, this.export_project_form.value))
     this.dialogRef.close();
  }
}
