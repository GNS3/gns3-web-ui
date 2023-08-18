import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Link } from '../../../../models/link';
import { Project } from '../../../../models/project';
import{ Controller } from '../../../../models/controller';
import { ToasterService } from '../../../../services/toaster.service';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { LinkService } from '../../../../services/link.service';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../../cartography/events/links-event-source';
import { LinkToMapLinkConverter } from '../../../../cartography/converters/map/link-to-map-link-converter';

@Component({
  selector: 'app-link-style-editor',
  templateUrl: './link-style-editor.component.html',
  styleUrls: ['./link-style-editor.component.scss'],
})
export class LinkStyleEditorDialogComponent implements OnInit {
  controller:Controller ;
  project: Project;
  link: Link;
  formGroup: UntypedFormGroup;
  borderTypes = ["Solid", "Dash", "Dot", "Dash Dot", "Dash Dot Dot"];

  constructor(
    public dialogRef: MatDialogRef<LinkStyleEditorDialogComponent>,
    private formBuilder: UntypedFormBuilder,
    private toasterService: ToasterService,
    private linkService: LinkService,
    private linksDataSource: LinksDataSource,
    private linksEventSource: LinksEventSource,
    private linkToMapLink: LinkToMapLinkConverter,
    private nonNegativeValidator: NonNegativeValidator
  ) {
    this.formGroup = this.formBuilder.group({
      color: new UntypedFormControl('', [Validators.required]),
      width: new UntypedFormControl('', [Validators.required, nonNegativeValidator.get]),
      type: new UntypedFormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    if (!this.link.link_style?.color) {
        this.formGroup.controls['color'].setValue("#000000");
    } else {
        this.formGroup.controls['color'].setValue(this.link.link_style.color);
    }

    this.formGroup.controls['width'].setValue(this.link.link_style.width);

    let type = this.borderTypes[0];
    if (this.link.link_style?.type) {
        type = this.borderTypes[this.link.link_style.type];
    }
    this.formGroup.controls['type'].setValue(type);
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onYesClick() {
    if (this.formGroup.valid) {
      this.link.link_style.color = this.formGroup.get('color').value;
      this.link.link_style.width = this.formGroup.get('width').value;

      let type = this.borderTypes.indexOf(this.formGroup.get('type').value);
      this.link.link_style.type = type;

      this.linkService.updateLinkStyle(this.controller, this.link).subscribe((link) => {
        this.linksDataSource.update(link);
        this.linksEventSource.edited.next(this.linkToMapLink.convert(link));
        location.reload()
        // we add this code/line for reload the entire page because single graph/link style is not updated automatically.
        // this.toasterService.success("Link updated");
        this.dialogRef.close();
      });
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}
