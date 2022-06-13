import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { Server } from '../../models/server';
import { ProjectService } from '../../services/project.service';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-export-portable-project',
  templateUrl: './export-portable-project.component.html',
  styleUrls: ['./export-portable-project.component.scss'],
})
export class ExportPortableProjectComponent implements OnInit {
  uploader: FileUploader;
  export_project_form: FormGroup;
  chosenImage: string = '';
  compression_methods: any = [];
  compression_level: any = [];
  compression_filter_value: any = [];
  server: Server;
  index: number = 4;

  constructor(
    public dialogRef: MatDialogRef<ExportPortableProjectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toasterService: ToasterService,
    private projectService: ProjectService,
    private _fb: FormBuilder
  ) {}

  async ngOnInit() {
    this.server = this.data;
    await this.formControls();
    this.compression_methods = this.projectService.getCompression();
    this.compression_level = this.projectService.getCompressionLevel();
    this.uploader = new FileUploader({});

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error occured: ' + response);
    };
    this.uploader.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.success('Image uploaded');
    };

    this.uploader.onProgressItem = (progress: any) => {};
    this.selectCompression({ value: this.compression_methods[this.index] });
    this.export_project_form.get('compression').setValue(this.compression_methods[this.index]);
  }

  formControls() {
    this.export_project_form = this._fb.group({
      file_path: ['', Validators.required],
      compression: ['', Validators.required],
      compression_level: ['', Validators.required],
      include_base_image: [false, Validators.required],
      include_snapshots: [false, Validators.required],
      reset_mac_address: [false, Validators.required],
    });
    this.export_project_form.valueChanges.subscribe(() => {});
  }

  uploadImageFile(event) {}

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
    let response;
    this.export_project_form.value.compression = this.export_project_form.value.compression.value;
    this.projectService.exportPortableProject(this.server, this.export_project_form.value).subscribe((res) => {
      response = res;
    });
  }
}
