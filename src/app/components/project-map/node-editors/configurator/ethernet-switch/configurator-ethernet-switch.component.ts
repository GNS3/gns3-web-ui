import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, viewChild } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { PortsComponent } from '@components/preferences/common/ports/ports.component';
import { Controller } from '@models/controller';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-configurator-ethernet-switch',
  templateUrl: './configurator-ethernet-switch.component.html',
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
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    PortsComponent,
  ],
})
export class ConfiguratorDialogEthernetSwitchComponent implements OnInit {
  readonly portsComponent = viewChild(PortsComponent);

  private dialogRef = inject(MatDialogRef<ConfiguratorDialogEthernetSwitchComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private ethernetSwitchesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  inputForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {
    this.inputForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      console_type: new UntypedFormControl(''),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = this.node.name;

      // Update form values with node data
      this.inputForm.patchValue({
        name: node.name,
        console_type: node.console_type || '',
      });

      this.getConfiguration();
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.cd.markForCheck();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.ethernetSwitchesConfigurationService.getConsoleTypesForEthernetSwitches();
  }

  onSaveClick() {
    if (this.inputForm.valid) {
      // Merge form values back into node
      const formValues = this.inputForm.value;

      this.node.name = formValues.name;
      this.node.console_type = formValues.console_type;

      this.node.properties.ports_mapping = this.portsComponent().ethernetPorts;
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
