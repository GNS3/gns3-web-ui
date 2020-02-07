import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { VpcsConfigurationService } from '../../../../../services/vpcs-configuration.service';


@Component({
    selector: 'app-configurator-vpcs',
    templateUrl: './configurator-vpcs.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogVpcsComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    inputForm: FormGroup;
    consoleTypes: string[] = [];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogVpcsComponent>,
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
            this.name = node.name;
            this.getConfiguration();
        });
    }

    getConfiguration() {
        this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
    }

    onSaveClick() {
        if (this.inputForm.valid) {
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
