import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-configurator-atm-switch',
  templateUrl: './configurator-atm-switch.component.html',
  styleUrls: ['../configurator.component.scss', '../../../../preferences/preferences.component.scss'],
})
export class ConfiguratorDialogAtmSwitchComponent implements OnInit {
  server: Server;
  node: Node;
  name: string;
  nameForm: FormGroup;
  inputForm: FormGroup;
  abstractForm: FormGroup;
  consoleTypes: string[] = [];

  nodeMappings = new Map<string, string>();
  nodeMappingsDataSource: NodeMapping[] = [];
  dataSource = [];
  displayedColumns = ['portIn', 'portOut', 'actions'];

  sourcePort: string = '';
  sourceVpi: string = '';
  sourceVci: string = '';
  destinationPort: string = '';
  destinationVpi: string = '';
  destinationVci: string = '';

  useVpiOnly: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogAtmSwitchComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder
  ) {
    this.nameForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
    });

    this.inputForm = this.formBuilder.group({
      sourcePort: new FormControl('', Validators.required),
      sourceVci: new FormControl('', Validators.required),
      destinationPort: new FormControl('', Validators.required),
      destinationVci: new FormControl('', Validators.required),
    });

    this.abstractForm = this.formBuilder.group({
      sourceVpi: new FormControl('', Validators.required),
      destinationVpi: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
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
    });
  }

  delete(elem: NodeMapping) {
    this.nodeMappingsDataSource = this.nodeMappingsDataSource.filter((n) => n !== elem);
  }

  add() {
    if (this.inputForm.valid) {
      let nodeMapping: NodeMapping;
      if (!this.useVpiOnly) {
        if (this.abstractForm.valid) {
          nodeMapping = {
            portIn: `${this.sourcePort}:${this.sourceVpi}:${this.sourceVci}`,
            portOut: `${this.destinationPort}:${this.destinationVpi}:${this.destinationVci}`,
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
      } else {
        nodeMapping = {
          portIn: `${this.sourcePort}:${this.sourceVci}`,
          portOut: `${this.destinationPort}:${this.destinationVci}`,
        };

        if (this.nodeMappingsDataSource.filter((n) => n.portIn === nodeMapping.portIn).length > 0) {
          this.toasterService.error('Mapping already defined.');
        } else {
          this.nodeMappingsDataSource = this.nodeMappingsDataSource.concat([nodeMapping]);
          this.clearUserInput();
        }
      }
    } else {
      this.toasterService.error('Fill all required fields.');
    }
  }

  clearUserInput() {
    this.sourcePort = '0';
    this.sourceVpi = '0';
    this.sourceVci = '0';
    this.destinationPort = '0';
    this.destinationVpi = '0';
    this.sourceVci = '0';
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

      this.nodeService.updateNode(this.server, this.node).subscribe(() => {
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
