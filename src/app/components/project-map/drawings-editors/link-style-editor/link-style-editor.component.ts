import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { LinkService } from '@services/link.service';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../../cartography/events/links-event-source';
import { LinkToMapLinkConverter } from '../../../../cartography/converters/map/link-to-map-link-converter';

@Component({
  selector: 'app-link-style-editor',
  templateUrl: './link-style-editor.component.html',
  styleUrl: './link-style-editor.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkStyleEditorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<LinkStyleEditorDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private linksEventSource = inject(LinksEventSource);
  private linkToMapLink = inject(LinkToMapLinkConverter);
  private nonNegativeValidator = inject(NonNegativeValidator);

  controller: Controller;
  project: Project;
  link: Link;
  formGroup: UntypedFormGroup;
  borderTypes = ['Solid', 'Dash', 'Dot', 'Dash Dot', 'Dash Dot Dot'];

  constructor() {
    this.formGroup = this.formBuilder.group({
      color: new UntypedFormControl('', [Validators.required]),
      width: new UntypedFormControl('', [Validators.required, this.nonNegativeValidator.get]),
      type: new UntypedFormControl('', [Validators.required]),
    });
  }

  ngOnInit() {
    // Use the canonical default color per link type so CSS can handle theme conversion.
    // Saving a theme-adjusted color would lock the cable permanently, breaking switching.
    const defaultColor = this.link.link_type === 'serial' ? '#800000' : '#000000';
    this.formGroup.controls['color'].setValue(this.link.link_style?.color ?? defaultColor);

    const width = this.link.link_style?.width !== undefined ? this.link.link_style.width : 2;
    this.formGroup.controls['width'].setValue(width);

    let type = this.borderTypes[0];
    if (this.link.link_style?.type !== undefined) {
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
        location.reload();
        // we add this code/line for reload the entire page because single graph/link style is not updated automatically.
        // this.toasterService.success("Link updated");
        this.dialogRef.close();
      });
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}
