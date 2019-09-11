import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material';
import { CustomAdaptersTableComponent } from '../../../../../components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { QemuService } from '../../../../../services/qemu.service';
import { QemuConfigurationService } from '../../../../../services/qemu-configuration.service';
import { QemuBinary } from '../../../../../models/qemu/qemu-binary';


@Component({
    selector: 'app-configurator-qemu',
    templateUrl: './configurator-qemu.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogQemuComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    generalSettingsForm: FormGroup;
    consoleTypes: string[] = [];
    binaries: QemuBinary[] = [];
    onCloseOptions = [];
    bootPriorities = [];
    diskInterfaces: string[] = [];

    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
    networkTypes = [];

    @ViewChild("customAdapters", {static: false}) customAdapters: CustomAdaptersTableComponent;

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogQemuComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private qemuService: QemuService,
        private qemuConfigurationService: QemuConfigurationService
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            name: new FormControl('', Validators.required),
            ram: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.name = node.name;
            this.getConfiguration();
        })

        this.qemuService.getBinaries(this.server).subscribe((qemuBinaries: QemuBinary[]) => {
            this.binaries = qemuBinaries;
        });
    }

    getConfiguration() {
        this.consoleTypes = this.qemuConfigurationService.getConsoleTypes();
        this.onCloseOptions = this.qemuConfigurationService.getOnCloseOptions();
        this.networkTypes = this.qemuConfigurationService.getNetworkTypes();
        this.bootPriorities = this.qemuConfigurationService.getBootPriorities();
        this.diskInterfaces = this.qemuConfigurationService.getDiskInterfaces();
    }

    onSaveClick() {
        if (this.generalSettingsForm.valid) {
            this.node.custom_adapters = [];
            this.customAdapters.adapters.forEach(n => {
                this.node.custom_adapters.push({
                    adapter_number: n.adapter_number,
                    adapter_type: n.adapter_type
                })
            });

            this.node.properties.adapters = this.node.custom_adapters.length;

            this.nodeService.updateNodeWithCustomAdapters(this.server, this.node).subscribe(() => {
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
