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
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-configurator-switch',
  templateUrl: './configurator-switch.component.html',
  styleUrls: ['../configurator.component.scss', '../../../../preferences/preferences.component.scss'],
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
    MatIconModule,
    MatTooltipModule,
  ],
})
export class ConfiguratorDialogSwitchComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogSwitchComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  nameForm: UntypedFormGroup;
  inputForm: UntypedFormGroup;
  consoleTypes: string[] = [];

  nodeMappings = new Map<string, string>();
  nodeMappingsDataSource: NodeMapping[] = [];
  dataSource = [];
  displayedColumns = ['portIn', 'portOut', 'actions'];

  sourcePort: string = '';
  sourceDlci: string = '';
  destinationPort: string = '';
  destinationDlci: string = '';

  constructor() {
    this.nameForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });

    this.inputForm = this.formBuilder.group({
      sourcePort: new UntypedFormControl('', Validators.required),
      sourceDlci: new UntypedFormControl('', Validators.required),
      destinationPort: new UntypedFormControl('', Validators.required),
      destinationDlci: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;

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
    });
  }

  delete(elem: NodeMapping) {
    this.nodeMappingsDataSource = this.nodeMappingsDataSource.filter((n) => n !== elem);
  }

  add() {
    if (this.inputForm.valid) {
      let nodeMapping: NodeMapping = {
        portIn: `${this.sourcePort}:${this.sourceDlci}`,
        portOut: `${this.destinationPort}:${this.destinationDlci}`,
      };

      if (this.nodeMappingsDataSource.filter((n) => n.portIn === nodeMapping.portIn).length > 0) {
        this.toasterService.error('Mapping already defined.');
      } else {
        this.nodeMappingsDataSource = this.nodeMappingsDataSource.concat([nodeMapping]);
        this.clearUserInput();
      }
    } else {
      this.toasterService.error('Fill all required fields.');
    }
  }

  clearUserInput() {
    this.sourcePort = '0';
    this.sourceDlci = '1';
    this.destinationPort = '0';
    this.destinationDlci = '1';
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
      this.nodeMappings.clear();
      this.nodeMappingsDataSource.forEach((elem) => {
        this.nodeMappings.set(elem.portIn, elem.portOut);
      });

      this.node.properties.mappings = Array.from(this.nodeMappings).reduce(
        (obj, [key, value]) => Object.assign(obj, { [key]: value }),
        {}
      );

      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
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
