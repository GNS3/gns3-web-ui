import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';
import { ValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-ethernet-hub',
  templateUrl: './configurator-ethernet-hub.component.html',
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
export class ConfiguratorDialogEthernetHubComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogEthernetHubComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private vpcsConfigurationService = inject(VpcsConfigurationService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(ValidationService);

  controller: Controller;
  node: Node;
  numberOfPorts: number;
  consoleTypes: string[] = [];
  categories = [];
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  // Model signals
  readonly nodeName = model('');
  readonly nodeNumberOfPorts = model('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = this.node.name;
        this.numberOfPorts = this.node.ports.length;

        // Update model signals with node data
        this.nodeName.set(node.name || '');
        this.nodeNumberOfPorts.set(this.node.ports.length.toString());

        this.getConfiguration();
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

  getConfiguration() {
    this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
    this.categories = this.vpcsConfigurationService.getCategories();
  }

  onSaveClick() {
    // Validate name (required)
    const nameValidation = this.validationService.required(this.nodeName(), 'Name');
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    // Validate number of ports (non-negative integer)
    const portsValue = this.nodeNumberOfPorts();
    if (portsValue && portsValue.trim() !== '') {
      const numValue = parseInt(portsValue, 10);
      if (isNaN(numValue) || numValue < 0 || numValue !== parseFloat(portsValue)) {
        this.toasterService.error('Number of ports must be a non-negative integer');
        return;
      }
      this.numberOfPorts = numValue;
    } else {
      this.numberOfPorts = 0;
    }

    // Merge signal values back into node
    this.node.name = this.nodeName();

    this.node.properties.ports_mapping = [];
    for (let i = 0; i < this.numberOfPorts; i++) {
      this.node.properties.ports_mapping.push({
        name: `Ethernet${i}`,
        port_number: i,
      });
    }

    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
        this.cd.markForCheck();
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
