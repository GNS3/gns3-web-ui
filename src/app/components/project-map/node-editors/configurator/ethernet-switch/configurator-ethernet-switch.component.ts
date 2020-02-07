import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { Node } from '../../../../../cartography/models/node';
import { PortsComponent } from '../../../../../components/preferences/common/ports/ports.component';
import { Server } from '../../../../../models/server';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';


@Component({
    selector: 'app-configurator-ethernet-switch',
    templateUrl: './configurator-ethernet-switch.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogEthernetSwitchComponent implements OnInit {
    @ViewChild(PortsComponent, {static: false}) portsComponent: PortsComponent;
    server: Server;
    node: Node;
    name: string;
    inputForm: FormGroup;
    consoleTypes: string[] = [];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogEthernetSwitchComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private ethernetSwitchesConfigurationService: BuiltInTemplatesConfigurationService
    ) {
        this.inputForm = this.formBuilder.group({
            name: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.name = this.node.name;
            this.getConfiguration();
        });
    }

    getConfiguration() {
        this.consoleTypes = this.ethernetSwitchesConfigurationService.getConsoleTypesForEthernetSwitches();
    }

    onSaveClick() {
        if (this.inputForm.valid) {
            this.node.properties.ports_mapping = this.portsComponent.ethernetPorts;
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
