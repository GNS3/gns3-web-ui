import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
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

@Component({
  standalone: true,
  selector: 'app-configurator-nat',
  templateUrl: './configurator-nat.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;

      // Update form values with node data
      this.generalSettingsForm.patchValue({
        name: node.name,
      });

      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.cd.markForCheck();
    });
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      // Merge form values back into node
      const formValues = this.generalSettingsForm.value;

      this.node.name = formValues.name;

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
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
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
