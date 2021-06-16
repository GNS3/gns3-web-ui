import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Link } from '../../../../models/link';
import { Project } from '../../../../models/project';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { LinkService } from '../../../../services/link.service';

@Component({
  selector: 'app-link-style-editor',
  templateUrl: './link-style-editor.component.html',
  styleUrls: ['./link-style-editor.component.scss'],
})
export class LinkStyleEditorDialogComponent implements OnInit {
  server: Server;
  project: Project;
  link: Link;
  formGroup: FormGroup;
  borderTypes = ["Solid", "Dash", "Dot", "Dash Dot"];

  constructor(
    public dialogRef: MatDialogRef<LinkStyleEditorDialogComponent>,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService,
    private linkService: LinkService,
    private nonNegativeValidator: NonNegativeValidator
  ) {
    this.formGroup = this.formBuilder.group({
      color: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      width: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      type: new FormControl('', [Validators.required, nonNegativeValidator.get])
    });
  }

  ngOnInit() {
    this.formGroup.controls['color'].setValue(this.link.link_style.color);
    this.formGroup.controls['width'].setValue(this.link.link_style.width);
    this.formGroup.controls['type'].setValue(this.link.link_style.width);
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onYesClick() {
    if (this.formGroup.valid) {
      this.link.link_style.color = this.formGroup.get('color').value;
      this.link.link_style.width = this.formGroup.get('width').value;
      this.link.link_style.type = this.formGroup.get('type').value;

      this.linkService.updateLink(this.server, this.link).subscribe(() => {
        this.toasterService.success("Link updated");
        this.dialogRef.close();
      });
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}
