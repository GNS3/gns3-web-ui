import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { IouConfigurationService } from '../../../../../services/iou-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';


@Component({
    selector: 'app-configurator-iou',
    templateUrl: './configurator-iou.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogIouComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    generalSettingsForm: FormGroup;
    networkForm: FormGroup;
    consoleTypes: string[] = [];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogIouComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private configurationService: IouConfigurationService
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            name: new FormControl('', Validators.required)
        });

        this.networkForm = this.formBuilder.group({
            ethernetAdapters: new FormControl('', Validators.required),
            serialAdapters: new FormControl('', Validators.required)
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
        this.consoleTypes = this.configurationService.getConsoleTypes();
    }

    onSaveClick() {
        if (this.generalSettingsForm.valid && this.networkForm.valid) {
            this.nodeService. updateNode(this.server, this.node).subscribe(() => {
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
