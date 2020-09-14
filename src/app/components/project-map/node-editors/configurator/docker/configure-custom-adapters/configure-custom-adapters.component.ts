import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../../cartography/models/node';
import { Server } from '../../../../../../models/server';
import { NodeService } from '../../../../../../services/node.service';
import { ToasterService } from '../../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DockerConfigurationService } from '../../../../../../services/docker-configuration.service';


@Component({
    selector: 'app-configure-custom-adapters',
    templateUrl: './configure-custom-adapters.component.html',
    styleUrls: ['../../configurator.component.scss']
})
export class ConfigureCustomAdaptersDialogComponent implements OnInit {
    server: Server;
    node: Node;

    constructor(
        public dialogRef: MatDialogRef<ConfigureCustomAdaptersDialogComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private dockerConfigurationService: DockerConfigurationService
    ) {}

    ngOnInit() {

    }

    getConfiguration() {}

    onSaveClick() {
        
    }

    onCancelClick() {
        this.dialogRef.close();
    }
}
