import { Component, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material';


@Component({
    selector: 'app-configurator-switch',
    templateUrl: './configurator-switch.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogSwitchComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    inputForm: FormGroup;
    consoleTypes: string[] = [];

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogSwitchComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder
    ) {
        this.inputForm = this.formBuilder.group({
            name: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.name = node.name;
        })
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
