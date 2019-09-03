import { Component, OnInit } from '@angular/core';
import { Node } from '../../../../cartography/models/node';
import { Project } from '../../../../models/project';
import { Server } from '../../../../models/server';
import { MatDialogRef } from '@angular/material';
import { NodeService } from '../../../../services/node.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
    selector: 'app-config-editor',
    templateUrl: './config-editor.component.html',
    styleUrls: ['./config-editor.component.scss']
})
export class ConfigEditorDialogComponent implements OnInit {
    server: Server;
    project: Project;
    node: Node;

    config: any;

    constructor(
        public dialogRef: MatDialogRef<ConfigEditorDialogComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService
    ) {}

    ngOnInit() {
        this.nodeService.getConfiguration(this.server, this.node).subscribe((config: any) => {
            this.config = config;
        });
    }

    onSaveClick() {
        this.nodeService.saveConfiguration(this.server, this.node, this.config).subscribe((response) => {
            this.dialogRef.close();
            this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
        });
    }

    onCancelClick() {
        this.dialogRef.close();
    }
}
