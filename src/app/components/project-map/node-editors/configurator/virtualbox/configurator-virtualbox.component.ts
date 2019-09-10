import { Component, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material';
import { VirtualBoxConfigurationService } from '../../../../../services/virtual-box-configuration.service';


@Component({
    selector: 'app-configurator-virtualbox',
    templateUrl: './configurator-virtualbox.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogVirtualBoxComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    generalSettingsForm: FormGroup;
    networkForm: FormGroup;
    consoleTypes: string[] = [];
    onCloseOptions = [];
    networkTypes = [];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogVirtualBoxComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private virtualBoxConfigurationService: VirtualBoxConfigurationService
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            name: new FormControl('', Validators.required),
            ram: new FormControl('', Validators.required)
        });

        this.networkForm = this.formBuilder.group({
            adapters: new FormControl('', Validators.required)
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
        this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
        this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
        this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
    }

    onSaveClick() {
        if (this.generalSettingsForm.valid) {
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
