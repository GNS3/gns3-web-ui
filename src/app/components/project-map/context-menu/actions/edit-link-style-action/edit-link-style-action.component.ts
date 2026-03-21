import { Component, OnChanges, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { LinkStyleEditorDialogComponent } from '../../../drawings-editors/link-style-editor/link-style-editor.component';

@Component({
  standalone: true,
  selector: 'app-edit-link-style-action',
  templateUrl: './edit-link-style-action.component.html',
  imports: [CommonModule, MatDialogModule, MatIconModule],
})
export class EditLinkStyleActionComponent implements OnChanges {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  constructor() {}

  ngOnChanges() {}

  editStyle() {
    const dialogRef = this.dialog.open(LinkStyleEditorDialogComponent, {
      width: '800px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.link = this.link();
  }
}
