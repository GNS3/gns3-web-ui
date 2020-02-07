import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Server } from '../../../../../models/server';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ServerService } from '../../../../../services/server.service';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { ToasterService } from '../../../../../services/toaster.service';


@Component({
    selector: 'app-cloud-nodes-add-template',
    templateUrl: './cloud-nodes-add-template.component.html',
    styleUrls: ['./cloud-nodes-add-template.component.scss', '../../../preferences.component.scss']
})
export class CloudNodesAddTemplateComponent implements OnInit {
    server: Server;
    templateName = '';
    formGroup: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService,
        private formBuilder: FormBuilder
    ) {
        this.formGroup = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
        });
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'builtin', 'cloud-nodes']);
    }

    addTemplate() {
        if (!this.formGroup.invalid) {
            let cloudTemplate: CloudTemplate;

            this.templateMocksService.getCloudNodeTemplate().subscribe((template: CloudTemplate) => {
                cloudTemplate = template;
            });

            cloudTemplate.template_id = uuid();
            cloudTemplate.name = this.formGroup.get('templateName').value;

            this.builtInTemplatesService.addTemplate(this.server, cloudTemplate).subscribe((cloudNodeTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
