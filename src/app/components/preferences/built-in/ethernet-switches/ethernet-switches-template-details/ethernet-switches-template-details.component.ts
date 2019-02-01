import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { PortsMappingEntity } from '../../../../../models/ethernetHub/ports-mapping-enity';


@Component({
    selector: 'app-ethernet-switches-template-details',
    templateUrl: './ethernet-switches-template-details.component.html',
    styleUrls: ['./ethernet-switches-template-details.component.scss']
})
export class EthernetSwitchesTemplateDetailsComponent implements OnInit {
    server: Server;
    ethernetSwitchTemplate: EthernetSwitchTemplate;
    inputForm: FormGroup;
    ethernetPorts: PortsMappingEntity[] = [];
    dataSource: PortsMappingEntity[] = [];
    newPort: PortsMappingEntity;

    categories = [["Default", "guest"],
                    ["Routers", "router"],
                    ["Switches", "switch"],
                    ["End devices", "end_device"],
                    ["Security devices", "security_device"]];
    consoleTypes: string[] = ['telnet', 'none'];
    portTypes: string[] = ['access', 'dot1q', 'qinq'];
    etherTypes: string[] = ['0x8100', '0x88A8', '0x9100', '0x9200'];
    displayedColumns: string[] = ['port_number', 'vlan', 'type', 'ethertype'];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder
    ) {
        this.inputForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required),
            defaultName: new FormControl('', Validators.required),
            symbol: new FormControl('', Validators.required)
        });

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

            this.builtInTemplatesService.getTemplate(this.server, template_id).subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
                this.ethernetSwitchTemplate = ethernetSwitchTemplate;
                this.ethernetPorts = this.ethernetSwitchTemplate.ports_mapping;
                this.dataSource =  this.ethernetSwitchTemplate.ports_mapping;
            });
        });
    }

    onAdd() {
        this.ethernetPorts.push(this.newPort);
        this.dataSource = [...this.ethernetPorts];
        
        this.newPort = {
            name: '',
            port_number: 0,
        };
    }

    onSave() {
        if (this.inputForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.builtInTemplatesService.saveTemplate(this.server, this.ethernetSwitchTemplate).subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }
}
