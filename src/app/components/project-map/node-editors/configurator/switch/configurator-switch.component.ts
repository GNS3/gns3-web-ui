import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-configurator-switch',
  templateUrl: './configurator-switch.component.html',
  styleUrls: ['../configurator.component.scss', '../../../../preferences/preferences.component.scss'],
})
export class ConfiguratorDialogSwitchComponent implements OnInit {
  controller:Controller ;
  node: Node;
  name: string;
  nameForm: FormGroup;
  inputForm: FormGroup;
  consoleTypes: string[] = [];

  nodeMappings = new Map<string, string>();
  nodeMappingsDataSource: NodeMapping[] = [];
  dataSource = [];
  displayedColumns = ['portIn', 'portOut', 'actions'];

  sourcePort: string = '';
  sourceDlci: string = '';
  destinationPort: string = '';
  destinationDlci: string = '';

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogSwitchComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder
  ) {
    this.nameForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
    });

    this.inputForm = this.formBuilder.group({
      sourcePort: new FormControl('', Validators.required),
      sourceDlci: new FormControl('', Validators.required),
      destinationPort: new FormControl('', Validators.required),
      destinationDlci: new FormControl('', Validators.required),
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
    this.sourceDlci = '0';
    this.destinationPort = '0';
    this.destinationDlci = '0';
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
