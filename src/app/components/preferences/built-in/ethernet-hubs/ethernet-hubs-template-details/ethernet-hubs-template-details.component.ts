import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';


@Component({
    selector: 'app-ethernet-hubs-template-details',
    templateUrl: './ethernet-hubs-template-details.component.html',
    styleUrls: ['./ethernet-hubs-template-details.component.scss']
})
export class EthernetHubsTemplateDetailsComponent implements OnInit {
    server: Server;
    ethernetHubTemplate: EthernetHubTemplate;
    numberOfPorts: number;
    inputForm: FormGroup;

    categories = [["Default", "guest"],
                    ["Routers", "router"],
                    ["Switches", "switch"],
                    ["End devices", "end_device"],
                    ["Security devices", "security_device"]];

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
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.builtInTemplatesService.getTemplate(this.server, template_id).subscribe((ethernetHubTemplate: EthernetHubTemplate) => {
                this.ethernetHubTemplate = ethernetHubTemplate;
                this.numberOfPorts =  this.ethernetHubTemplate.ports_mapping.length;
            });
        });
    }

    onSave() {
        if (this.inputForm.invalid || ! this.numberOfPorts) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.ethernetHubTemplate.ports_mapping = [];
            for(let i=0; i<this.numberOfPorts; i++){
                this.ethernetHubTemplate.ports_mapping.push({
                    name: `Ethernet${i}`,
                    port_number: i
                });
            }

            this.builtInTemplatesService.saveTemplate(this.server, this.ethernetHubTemplate).subscribe((ethernetHubTemplate: EthernetHubTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }
}
