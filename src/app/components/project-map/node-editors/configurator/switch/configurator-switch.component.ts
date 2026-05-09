import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-switch',
  templateUrl: './configurator-switch.component.html',
  styleUrl: '../../../../preferences/preferences.component.scss',
  styles: [
    `
      .fr-switch__input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 16px;
      }

      .fr-switch__add-btn {
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
    MatIconModule,
    MatTooltipModule,
  ],
})
export class ConfiguratorDialogSwitchComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogSwitchComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(ValidationService);

  controller: Controller;
  node: Node;
  name: string;
  consoleTypes: string[] = [];

  nodeMappings = new Map<string, string>();
  nodeMappingsDataSource: NodeMapping[] = [];
  dataSource = [];
  displayedColumns = ['portIn', 'portOut', 'actions'];

  // Model signals
  readonly nodeName = model('');
  readonly sourcePort = model('');
  readonly sourceDlci = model('');
  readonly destinationPort = model('');
  readonly destinationDlci = model('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;
        this.nodeName.set(node.name || '');

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
  }

  add() {
    const sp = this.sourcePort();
    const sd = this.sourceDlci();
    const dp = this.destinationPort();
    const dd = this.destinationDlci();

    // Validate source port: required + non-negative integer
    const spRequired = this.validationService.required(sp, 'Source Port');
    if (!spRequired.isValid) {
      this.toasterService.error(spRequired.errorMessage);
      return;
    }
    const spValid = this.validationService.validatePort(sp);
    if (!spValid.isValid) {
      this.toasterService.error('Source Port must be a non-negative integer');
      return;
    }

    // Validate source DLCI: required
    const sdRequired = this.validationService.required(sd, 'Source DLCI');
    if (!sdRequired.isValid) {
      this.toasterService.error(sdRequired.errorMessage);
      return;
    }

    // Validate destination port: required + non-negative integer
    const dpRequired = this.validationService.required(dp, 'Destination Port');
    if (!dpRequired.isValid) {
      this.toasterService.error(dpRequired.errorMessage);
      return;
    }
    const dpValid = this.validationService.validatePort(dp);
    if (!dpValid.isValid) {
      this.toasterService.error('Destination Port must be a non-negative integer');
      return;
    }

    // Validate destination DLCI: required
    const ddRequired = this.validationService.required(dd, 'Destination DLCI');
    if (!ddRequired.isValid) {
      this.toasterService.error(ddRequired.errorMessage);
      return;
    }

    let nodeMapping: NodeMapping = {
      portIn: `${sp}:${sd}`,
      portOut: `${dp}:${dd}`,
    };

    if (this.nodeMappingsDataSource.filter((n) => n.portIn === nodeMapping.portIn).length > 0) {
      this.toasterService.error('Mapping already defined.');
    } else {
      this.nodeMappingsDataSource = this.nodeMappingsDataSource.concat([nodeMapping]);
      this.clearUserInput();
    }
  }

  clearUserInput() {
    this.sourcePort.set('');
    this.sourceDlci.set('');
    this.destinationPort.set('');
    this.destinationDlci.set('');
  }

  strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
      obj[k] = v;
    }
    return obj;
  }

  onSaveClick() {
    // Validate name (required)
    const nameValidation = this.validationService.required(this.nodeName(), 'Name');
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    this.node.name = this.nodeName();
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
