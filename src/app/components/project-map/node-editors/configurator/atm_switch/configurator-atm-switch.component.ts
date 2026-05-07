import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { AtmSwitchValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-atm-switch',
  templateUrl: './configurator-atm-switch.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'atm-switch-config-panel'
  styles: [
    `
      .atm-switch__input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 16px;
      }

      .atm-switch__add-btn {
        display: flex;
        justify-content: center;
        margin-bottom: 16px;

        button {
          width: 80%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class ConfiguratorDialogAtmSwitchComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogAtmSwitchComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(AtmSwitchValidationService);

  controller: Controller;
  node: Node;
  name: string;

  // Model signals for form fields
  readonly nameSignal = model('');
  readonly useVpiOnly = model(false);

  // Input form fields
  readonly sourcePort = model('');
  readonly sourceVci = model('');
  readonly destinationPort = model('');
  readonly destinationVci = model('');

  // Abstract form fields
  readonly sourceVpi = model('');
  readonly destinationVpi = model('');

  consoleTypes: string[] = [];

  nodeMappings = new Map<string, string>();
  nodeMappingsDataSource: NodeMapping[] = [];
  dataSource = [];
  displayedColumns = ['portIn', 'portOut', 'actions'];

  constructor() {}

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update model signals with node data
        this.nameSignal.set(node.name);
        this.useVpiOnly.set(false);

        let mappings = node.properties.mappings;
        Object.keys(mappings).forEach((key) => {
          this.nodeMappings.set(key, mappings[key]);
        });

        this.nodeMappingsDataSource = Array.from(this.nodeMappings.entries()).map(([key, value]) => ({
          portIn: key,
          portOut: value,
        }));
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  delete(elem: NodeMapping) {
    this.nodeMappingsDataSource = this.nodeMappingsDataSource.filter((n) => n !== elem);
    this.cd.markForCheck();
  }

  add() {
    // Validate all input fields using validation service
    const validationResult = this.validationService.validateMappingEntry(
      this.sourcePort(),
      this.sourceVci(),
      this.destinationPort(),
      this.destinationVci(),
      this.sourceVpi(),
      this.destinationVpi(),
      this.useVpiOnly()
    );

    if (!validationResult.isValid) {
      this.toasterService.error(validationResult.errorMessage || 'Invalid input');
      return;
    }

    // Build mapping based on useVpiOnly mode
    let nodeMapping: NodeMapping;

    if (!this.useVpiOnly()) {
      // VC format: port:vpi:vci
      nodeMapping = {
        portIn: `${this.sourcePort()}:${this.sourceVpi()}:${this.sourceVci()}`,
        portOut: `${this.destinationPort()}:${this.destinationVpi()}:${this.destinationVci()}`,
      };
    } else {
      // VP format: port:vci
      nodeMapping = {
        portIn: `${this.sourcePort()}:${this.sourceVci()}`,
        portOut: `${this.destinationPort()}:${this.destinationVci()}`,
      };
    }

    // Validate uniqueness
    const uniqueValidation = this.validationService.validateUniqueMapping(
      nodeMapping.portIn,
      this.nodeMappingsDataSource
    );

    if (!uniqueValidation.isValid) {
      this.toasterService.error(uniqueValidation.errorMessage || 'Mapping already defined');
      return;
    }

    // Add mapping
    this.nodeMappingsDataSource = this.nodeMappingsDataSource.concat([nodeMapping]);
    this.clearUserInput();
    this.cd.markForCheck();
  }

  clearUserInput() {
    this.sourcePort.set('');
    this.sourceVci.set('');
    this.destinationPort.set('');
    this.destinationVci.set('');
    this.sourceVpi.set('');
    this.destinationVpi.set('');
  }

  strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
      obj[k] = v;
    }
    return obj;
  }

  onSaveClick() {
    if (!this.nameSignal()) {
      this.toasterService.error('Fill all required fields.');
      return;
    }

    // Merge model signals back into node
    this.node.name = this.nameSignal();
    // useVpiOnly is already tracked by the model signal

    this.nodeMappings.clear();
    this.nodeMappingsDataSource.forEach((elem) => {
      this.nodeMappings.set(elem.portIn, elem.portOut);
    });

    this.node.properties.mappings = Array.from(this.nodeMappings).reduce(
      (obj, [key, value]) => Object.assign(obj, { [key]: value }),
      {}
    );

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
}

export interface NodeMapping {
  portIn: string;
  portOut: string;
}
