import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { VpcsService } from '../../../../services/vpcs.service';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ToasterService } from '../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';


@Component({
    selector: 'app-add-vpcs-template',
    templateUrl: './add-vpcs-template.component.html',
    styleUrls: ['./add-vpcs-template.component.scss', '../../preferences.component.scss']
})
export class AddVpcsTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    templateNameForm: FormGroup
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vpcsService: VpcsService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService,
        private formBuilder: FormBuilder
    ) {
        this.templateNameForm = this.formBuilder.group({
            templateName: new FormControl(null, [Validators.required])
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
        });
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'vpcs', 'templates']);
    }

    addTemplate() {
        if (!this.templateNameForm.invalid) {
            this.templateName = this.templateNameForm.get('templateName').value;
            
            let vpcsTemplate: VpcsTemplate;

            this.templateMocksService.getVpcsTemplate().subscribe((template: VpcsTemplate) => {
                vpcsTemplate = template;
            });

            vpcsTemplate.template_id = uuid(),
            vpcsTemplate.name = this.templateName,

            this.vpcsService.addTemplate(this.server, vpcsTemplate).subscribe(() => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
