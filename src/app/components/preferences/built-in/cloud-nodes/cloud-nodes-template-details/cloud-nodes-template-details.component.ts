import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';


@Component({
    selector: 'app-cloud-nodes-template-details',
    templateUrl: './cloud-nodes-template-details.component.html',
    styleUrls: ['./cloud-nodes-template-details.component.scss']
})
export class CloudNodesTemplateDetailsComponent implements OnInit {
    server: Server;
    cloudNodeTemplate: CloudTemplate;
    inputForm: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder
    ) {
        this.inputForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.builtInTemplatesService.getTemplate(this.server, template_id).subscribe((cloudNodeTemplate: CloudTemplate) => {
                this.cloudNodeTemplate = cloudNodeTemplate;
            });
        });
    }

    onSave() {
        if (this.inputForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.builtInTemplatesService.saveTemplate(this.server, this.cloudNodeTemplate).subscribe((cloudNodeTemplate: CloudTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }
}
