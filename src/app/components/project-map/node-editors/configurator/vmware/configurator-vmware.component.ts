import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';
import { CustomAdaptersTableComponent } from '../../../../../components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { VmwareConfigurationService } from '../../../../../services/vmware-configuration.service';


@Component({
    selector: 'app-configurator-vmware',
    templateUrl: './configurator-vmware.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogVmwareComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    generalSettingsForm: FormGroup;
    consoleTypes: string[] = [];
    onCloseOptions = [];

    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
    networkTypes = [];

    @ViewChild("customAdapters") customAdapters: CustomAdaptersTableComponent;

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogVmwareComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private vmwareConfigurationService: VmwareConfigurationService
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            name: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.name = node.name;
            this.getConfiguration();
        })
    }

    getConfiguration() {
        this.consoleTypes = this.vmwareConfigurationService.getConsoleTypes();
        this.onCloseOptions = this.vmwareConfigurationService.getOnCloseoptions();
        this.networkTypes = this.vmwareConfigurationService.getNetworkTypes();
    }

    onSaveClick() {
        if (this.generalSettingsForm.valid) {
            this.node.custom_adapters = [];
            this.customAdapters.adapters.forEach(n => {
                this.node.custom_adapters.push({
                    adapter_number: n.adapter_number,
                    adapter_type: n.adapter_type
                })
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
