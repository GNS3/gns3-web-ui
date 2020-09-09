import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DockerConfigurationService } from '../../../../../services/docker-configuration.service';
import { NonNegativeValidator } from '../../../../../validators/non-negative-validator';


@Component({
    selector: 'app-configurator-docker',
    templateUrl: './configurator-docker.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogDockerComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    generalSettingsForm: FormGroup;
    consoleTypes: string[] = [];
    consoleResolutions: string[] = [
        '640x480',
        '800x600',
        '1024x768',
        '1280x800',
        '1280x1024',
        '1366x768',
        '1920x1080'
    ];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogDockerComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private dockerConfigurationService: DockerConfigurationService,
        private nonNegativeValidator: NonNegativeValidator,
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            name: new FormControl('', Validators.required),
            adapter: new FormControl('', Validators.required),
            memory: new FormControl('', nonNegativeValidator.get),
            cpus: new FormControl('', nonNegativeValidator.get),
            startCommand: new FormControl('', Validators.required),
            consoleHttpPort: new FormControl('', Validators.required),
            consoleHttpPath: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.name = node.name;
            this.getConfiguration();
            if (!this.node.properties.memory) this.node.properties.cpus = 0.0;
        });
    }

    getConfiguration() {
        this.consoleTypes = this.dockerConfigurationService.getConsoleTypes();
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
