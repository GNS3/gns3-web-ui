import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { PortsMappingEntity } from '../../../../../models/ethernetHub/ports-mapping-enity';


@Component({
    selector: 'app-cloud-nodes-template-details',
    templateUrl: './cloud-nodes-template-details.component.html',
    styleUrls: ['./cloud-nodes-template-details.component.scss']
})
export class CloudNodesTemplateDetailsComponent implements OnInit {
    server: Server;
    cloudNodeTemplate: CloudTemplate;

    categories = [["Default", "guest"],
                    ["Routers", "router"],
                    ["Switches", "switch"],
                    ["End devices", "end_device"],
                    ["Security devices", "security_device"]];
    consoleTypes: string[] = ['telnet', 'none'];

    tapInterface: string = '';
    ethernetInterface: string = '';
    ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];
    ports_mapping_ethernet: PortsMappingEntity[] = [];
    ports_mapping_tap: PortsMappingEntity[] = [];
    ports_mapping_udp: PortsMappingEntity[] = [];
    newPort: PortsMappingEntity;
    displayedColumns: string[] = ['name', 'lport', 'rhost', 'rport'];
    dataSourceUdp: PortsMappingEntity[] = [];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private toasterService: ToasterService
    ) {
        this.newPort = {
            name: '',
            port_number: 0,
        };
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.builtInTemplatesService.getTemplate(this.server, template_id).subscribe((cloudNodeTemplate: CloudTemplate) => {
                this.cloudNodeTemplate = cloudNodeTemplate;

                this.ports_mapping_ethernet = this.cloudNodeTemplate.ports_mapping
                    .filter((elem) => elem.type === 'ethernet');

                this.ports_mapping_tap = this.cloudNodeTemplate.ports_mapping
                    .filter((elem) => elem.type === 'tap');
                
                this.ports_mapping_udp = this.cloudNodeTemplate.ports_mapping
                    .filter((elem) => elem.type === 'udp');
                
                this.dataSourceUdp = this.ports_mapping_udp;
            });
        });
    }

    onAddEthernetInterface() {
        if (this.ethernetInterface) {
            this.ports_mapping_ethernet.push({
                interface: this.ethernetInterface,
                name: this.ethernetInterface,
                port_number: 0,
                type: "ethernet"
            });
        }
    }

    onAddTapInterface() {
        if (this.tapInterface) {
            this.ports_mapping_tap.push({
                interface: this.tapInterface,
                name: this.tapInterface,
                port_number: 0,
                type: "tap"
            });
        }
    }

    onAddUdpInterface() {
        this.ports_mapping_udp.push(this.newPort);
        this.dataSourceUdp = [...this.ports_mapping_udp];
        
        this.newPort = {
            name: '',
            port_number: 0,
        };
    }

    onSave() {
        this.cloudNodeTemplate.ports_mapping = [...this.ports_mapping_ethernet, ...this.ports_mapping_tap];

        this.builtInTemplatesService.saveTemplate(this.server, this.cloudNodeTemplate).subscribe((cloudNodeTemplate: CloudTemplate) => {
            this.toasterService.success("Changes saved");
        });
    }
}
