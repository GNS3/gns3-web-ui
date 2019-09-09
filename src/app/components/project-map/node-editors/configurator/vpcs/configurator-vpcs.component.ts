import { Component, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VpcsConfigurationService } from '../../../../../services/vpcs-configuration.service';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material';


@Component({
    selector: 'app-configurator-vpcs',
    templateUrl: './configurator-vpcs.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogVpcsComponent implements OnInit {
    server: Server;
    node: Node;

    inputForm: FormGroup;
    consoleTypes: string[] = [];
    categories = [];

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
            this.getConfiguration();
        })
    }

    getConfiguration() {
        this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
        this.categories = this.vpcsConfigurationService.getCategories();
    }

    onSaveClick() {
        this.nodeService.updateNode(this.server, this.node).subscribe(() => {
            this.toasterService.success(`Node ${this.node.name} updated.`);
            this.onCancelClick();
        });
    }

    onCancelClick() {
        this.dialogRef.close();
    }
}
