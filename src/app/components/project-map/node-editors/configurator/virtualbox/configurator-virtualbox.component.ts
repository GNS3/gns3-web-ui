import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { CustomAdaptersTableComponent } from '../../../../../components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { VirtualBoxConfigurationService } from '../../../../../services/virtual-box-configuration.service';

@Component({
  selector: 'app-configurator-virtualbox',
  templateUrl: './configurator-virtualbox.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogVirtualBoxComponent implements OnInit {
  server: Server;
  node: Node;
  name: string;
  generalSettingsForm: FormGroup;
  consoleTypes: string[] = [];
  onCloseOptions = [];

  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];

  @ViewChild('customAdapters') customAdapters: CustomAdaptersTableComponent;

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogVirtualBoxComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private virtualBoxConfigurationService: VirtualBoxConfigurationService
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
      ram: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
    this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      this.node.custom_adapters = [];
      this.customAdapters.adapters.forEach((n) => {
        this.node.custom_adapters.push({
          adapter_number: n.adapter_number,
          adapter_type: n.adapter_type,
        });
      });

      this.node.properties.adapters = this.node.custom_adapters.length;

      this.nodeService.updateNodeWithCustomAdapters(this.server, this.node).subscribe(() => {
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
