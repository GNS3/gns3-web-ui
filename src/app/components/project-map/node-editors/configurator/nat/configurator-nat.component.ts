import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipGrid, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-nat',
  templateUrl: './configurator-nat.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
  ],
})
export class ConfiguratorDialogNatComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogNatComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(ValidationService);

  controller: Controller;
  node: Node;
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  // Model signals
  readonly nodeName = model('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update model signals with node data
        this.nodeName.set(node.name || '');

        if (!this.node.tags) {
          this.node.tags = [];
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  onSaveClick() {
    const nameValidation = this.validationService.required(this.nodeName(), 'Name');
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    this.node.name = this.nodeName();

    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
      },
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.node) {
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.node.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.node.tags) {
      return;
    }
    const index = this.node.tags.indexOf(tag);

    if (index >= 0) {
      this.node.tags.splice(index, 1);
    }
  }
}
