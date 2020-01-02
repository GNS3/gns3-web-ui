import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MatDialogRef } from '@angular/material/dialog';
import { CustomAdaptersTableComponent } from '../../../../../components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { QemuBinary } from '../../../../../models/qemu/qemu-binary';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';
import { PortsMappingEntity } from '../../../../../models/ethernetHub/ports-mapping-enity';
import { UdpTunnelsComponent } from '../../../../../components/preferences/common/udp-tunnels/udp-tunnels.component';


@Component({
    selector: 'app-configurator-cloud',
    templateUrl: './configurator-cloud.component.html',
    styleUrls: ['../configurator.component.scss']
})
export class ConfiguratorDialogCloudComponent implements OnInit {
    server: Server;
    node: Node;
    name: string;
    generalSettingsForm: FormGroup;
    consoleTypes: string[] = [];
    binaries: QemuBinary[] = [];
    onCloseOptions = [];
    bootPriorities = [];
    diskInterfaces: string[] = [];

    portsMappingEthernet: PortsMappingEntity[] = [];
    portsMappingTap: PortsMappingEntity[] = [];
    portsMappingUdp: PortsMappingEntity[] = [];

    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
    networkTypes = [];
    tapInterface: string = '';
    ethernetInterface: string = '';
    ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];

    @ViewChild("udpTunnels") udpTunnels: UdpTunnelsComponent;

    constructor(
        public dialogRef: MatDialogRef<ConfiguratorDialogCloudComponent>,
        public nodeService: NodeService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private builtInTemplatesConfigurationService: BuiltInTemplatesConfigurationService,
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            name: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.name = node.name;
            this.getConfiguration();

            this.portsMappingEthernet = this.node.properties.ports_mapping
                .filter((elem) => elem.type === 'ethernet');

            this.portsMappingTap = this.node.properties.ports_mapping
                .filter((elem) => elem.type === 'tap');
            
            this.portsMappingUdp = this.node.properties.ports_mapping
                .filter((elem) => elem.type === 'udp');
        })
    }

    getConfiguration() {
        this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForCloudNodes();
    }

    onAddTapInterface() {
        if (this.tapInterface) {
            this.portsMappingTap.push({
                interface: this.tapInterface,
                name: this.tapInterface,
                port_number: 0,
                type: "tap"
            });
        }
    }

    onSaveClick() {
        if (this.generalSettingsForm.valid) {
            this.portsMappingUdp = this.udpTunnels.dataSourceUdp;

            this.node.properties.ports_mapping = this.portsMappingUdp.concat(this.portsMappingEthernet).concat(this.portsMappingTap);

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
