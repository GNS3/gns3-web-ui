import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CustomAdaptersTableComponent } from '../../../../../components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { QemuService } from '../../../../../services/qemu.service';
import { QemuConfigurationService } from '../../../../../services/qemu-configuration.service';
import { QemuBinary } from '../../../../../models/qemu/qemu-binary';
import { QemuImageCreatorComponent } from './qemu-image-creator/qemu-image-creator.component';
import { QemuImage } from '../../../../../models/qemu/qemu-image';


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
    qemuImages: QemuImage[] = [];

    private conf = {
        autoFocus: false,
        width: '800px'
    };
    dialogRefQemuImageCreator;

    @ViewChild("customAdapters") customAdapters: CustomAdaptersTableComponent;

    constructor(
        private dialog: MatDialog,
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

        this.qemuService.getImages(this.server).subscribe((qemuImages: QemuImage[]) => {
            this.qemuImages = qemuImages;
        });
    }

    openQemuImageCreator() {
        this.dialogRefQemuImageCreator = this.dialog.open(QemuImageCreatorComponent, this.conf);
        let instance = this.dialogRefQemuImageCreator.componentInstance;
        instance.server = this.server;
    }

    uploadCdromImageFile(event){
        this.node.properties.cdrom_image = event.target.files[0].name;
    }

    uploadInitrdFile(event){
        this.node.properties.initrd = event.target.files[0].name;
    }

    uploadKernelImageFile(event){
        this.node.properties.kernel_image = event.target.files[0].name;
    }

    uploadBiosFile(event){
        this.node.properties.bios_image = event.target.files[0].name;
    }

    getConfiguration() {
        this.consoleTypes = this.qemuConfigurationService.getConsoleTypes();
        this.onCloseOptions = this.qemuConfigurationService.getOnCloseOptions();
        this.qemuConfigurationService.getNetworkTypes().forEach(n => {
            this.networkTypes.push(n[0]);
        });
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

            this.nodeService. updateNodeWithCustomAdapters(this.server, this.node).subscribe(() => {
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
