import { Component, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VpcsConfigurationService } from '../../../../../services/vpcs-configuration.service';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';


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
    name: string;

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
            this.name = this.node.name;
            this.numberOfPorts = this.node.ports.length;
            this.getConfiguration();
        })
    }

    getConfiguration() {
        this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
        this.categories = this.vpcsConfigurationService.getCategories();
    }

    onSaveClick() {
        if (this.inputForm.valid) {
            this.node.properties.ports_mapping = [];
            for(let i=0; i<this.numberOfPorts; i++){
                this.node.properties.ports_mapping.push({
                    name: `Ethernet${i}`,
                    port_number: i
                });
            }

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
