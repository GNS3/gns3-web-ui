import { Component, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VpcsConfigurationService } from '../../../../../services/vpcs-configuration.service';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material';


@Component({
    selector: 'app-configurator-ethernet-hub',
    templateUrl: './configurator-ethernet-hub.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogEthernetHubComponent implements OnInit {
    server: Server;
    node: Node;
    numberOfPorts: number;
    inputForm: FormGroup;
    consoleTypes: string[] = [];
    categories = [];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogEthernetHubComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private vpcsConfigurationService: VpcsConfigurationService
    ) {
        this.inputForm = this.formBuilder.group({
            name: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.getConfiguration();
        })
    }

    getConfiguration() {
        this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
        this.categories = this.vpcsConfigurationService.getCategories();
    }

    onSaveClick() {
        if (this.inputForm.valid) {
            for(let i=0; i<this.numberOfPorts; i++){
                this.node.ports.push({
                    adapter_number: 0,
                    link_type: 'ethernet',
                    name: `Ethernet${i}`,
                    port_number: i,
                    short_name: `e${i}`
                });
            }

            // {
            //     "adapter_number": 0,
            //     "data_link_types": {
            //         "Ethernet": "DLT_EN10MB"
            //     },
            //     "link_type": "ethernet",
            //     "name": "Ethernet0",
            //     "port_number": 0,
            //     "short_name": "e0"
            // }

            this.nodeService.updateNode(this.server, this.node).subscribe(() => {
                this.toasterService.success(`Node ${this.node.name} updated.`);
                this.onCancelClick();
            });
        } else {
            this.toasterService.error(`Fill all required fields.`)
        }
    }

    onCancelClick() {
        this.dialogRef.close();
    }
}
