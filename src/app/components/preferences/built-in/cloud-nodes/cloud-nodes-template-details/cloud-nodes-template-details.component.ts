import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { PortsMappingEntity } from '../../../../../models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';


@Component({
    selector: 'app-cloud-nodes-template-details',
    templateUrl: './cloud-nodes-template-details.component.html',
    styleUrls: ['./cloud-nodes-template-details.component.scss']
})
export class CloudNodesTemplateDetailsComponent implements OnInit {
    server: Server;
    cloudNodeTemplate: CloudTemplate;

    isSymbolSelectionOpened: boolean = false;

    categories = [];
    consoleTypes: string[] = [];

    tapInterface: string = '';
    ethernetInterface: string = '';
    ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];
    portsMappingEthernet: PortsMappingEntity[] = [];
    portsMappingTap: PortsMappingEntity[] = [];
    portsMappingUdp: PortsMappingEntity[] = [];
    newPort: PortsMappingEntity;
    displayedColumns: string[] = ['name', 'lport', 'rhost', 'rport'];
    dataSourceUdp: PortsMappingEntity[] = [];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private toasterService: ToasterService,
        private builtInTemplatesConfigurationService: BuiltInTemplatesConfigurationService
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

            this.getConfiguration();
            this.builtInTemplatesService.getTemplate(this.server, template_id).subscribe((cloudNodeTemplate: CloudTemplate) => {
                this.cloudNodeTemplate = cloudNodeTemplate;

                this.portsMappingEthernet = this.cloudNodeTemplate.ports_mapping
                    .filter((elem) => elem.type === 'ethernet');

                this.portsMappingTap = this.cloudNodeTemplate.ports_mapping
                    .filter((elem) => elem.type === 'tap');
                
                this.portsMappingUdp = this.cloudNodeTemplate.ports_mapping
                    .filter((elem) => elem.type === 'udp');
                
                this.dataSourceUdp = this.portsMappingUdp;
            });
        });
    }

    getConfiguration() {
        this.categories = this.builtInTemplatesConfigurationService.getCategoriesForCloudNodes();
        this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForCloudNodes();
    }

    onAddEthernetInterface() {
        if (this.ethernetInterface) {
            this.portsMappingEthernet.push({
                interface: this.ethernetInterface,
                name: this.ethernetInterface,
                port_number: 0,
                type: "ethernet"
            });
        }
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

    onAddUdpInterface() {
        this.portsMappingUdp.push(this.newPort);
        this.dataSourceUdp = [...this.portsMappingUdp];
        
        this.newPort = {
            name: '',
            port_number: 0,
        };
    }

    onSave() {
        this.cloudNodeTemplate.ports_mapping = [...this.portsMappingEthernet, ...this.portsMappingTap];

        this.builtInTemplatesService.saveTemplate(this.server, this.cloudNodeTemplate).subscribe((cloudNodeTemplate: CloudTemplate) => {
            this.toasterService.success("Changes saved");
        });
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.cloudNodeTemplate.symbol = chosenSymbol;
    }
}
