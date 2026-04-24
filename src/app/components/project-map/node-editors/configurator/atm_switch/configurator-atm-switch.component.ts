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

@Component({
  standalone: true,
  selector: 'app-configurator-atm-switch',
  templateUrl: './configurator-atm-switch.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  nameForm: UntypedFormGroup;
  inputForm: UntypedFormGroup;
  abstractForm: UntypedFormGroup;
  consoleTypes: string[] = [];

  nodeMappings = new Map<string, string>();
  nodeMappingsDataSource: NodeMapping[] = [];
  dataSource = [];
  displayedColumns = ['portIn', 'portOut', 'actions'];

  useVpiOnly: boolean = false;

  constructor() {
    this.nameForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      useVpiOnly: new UntypedFormControl(false),
    });

    this.inputForm = this.formBuilder.group({
      sourcePort: new UntypedFormControl('', Validators.required),
      sourceVci: new UntypedFormControl('', Validators.required),
      destinationPort: new UntypedFormControl('', Validators.required),
      destinationVci: new UntypedFormControl('', Validators.required),
    });

    this.abstractForm = this.formBuilder.group({
      sourceVpi: new UntypedFormControl('', Validators.required),
      destinationVpi: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update form values with node data
        this.nameForm.patchValue({
          name: node.name,
          useVpiOnly: false,
        });

        let mappings = node.properties.mappings;
        Object.keys(mappings).forEach((key) => {
          this.nodeMappings.set(key, mappings[key]);
        });

        this.nodeMappings.forEach((value: string, key: string) => {
          this.nodeMappingsDataSource.push({
            portIn: key,
            portOut: value,
          });
        });
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
    const inputValues = this.inputForm.value;
    const abstractValues = this.abstractForm.value;

    if (this.inputForm.valid) {
      let nodeMapping: NodeMapping;
      const useVpiOnly = this.nameForm.value.useVpiOnly;

      if (!useVpiOnly) {
        if (this.abstractForm.valid) {
          nodeMapping = {
            portIn: `${inputValues.sourcePort}:${abstractValues.sourceVpi}:${inputValues.sourceVci}`,
            portOut: `${inputValues.destinationPort}:${abstractValues.destinationVpi}:${inputValues.destinationVci}`,
          };

          if (this.nodeMappingsDataSource.filter((n) => n.portIn === nodeMapping.portIn).length > 0) {
            this.toasterService.error('Mapping already defined.');
          } else {
            this.nodeMappingsDataSource = this.nodeMappingsDataSource.concat([nodeMapping]);
            this.clearUserInput();
            this.cd.markForCheck();
          }
        } else {
          this.toasterService.error('Fill all required fields.');
        }
      } else {
        nodeMapping = {
          portIn: `${inputValues.sourcePort}:${inputValues.sourceVci}`,
          portOut: `${inputValues.destinationPort}:${inputValues.destinationVci}`,
        };

        if (this.nodeMappingsDataSource.filter((n) => n.portIn === nodeMapping.portIn).length > 0) {
          this.toasterService.error('Mapping already defined.');
        } else {
          this.nodeMappingsDataSource = this.nodeMappingsDataSource.concat([nodeMapping]);
          this.clearUserInput();
          this.cd.markForCheck();
        }
      }
    } else {
      this.toasterService.error('Fill all required fields.');
    }
  }

  clearUserInput() {
    this.inputForm.reset();
    this.abstractForm.reset();
  }

  strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
      obj[k] = v;
    }
    return obj;
  }

  onSaveClick() {
    if (this.nameForm.valid) {
      // Merge form values back into node
      const formValues = this.nameForm.value;

      this.node.name = formValues.name;
      this.useVpiOnly = formValues.useVpiOnly;

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
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}

export interface NodeMapping {
  portIn: string;
  portOut: string;
}
