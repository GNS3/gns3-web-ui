import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../../services/server.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ComputeService } from '../../../../../services/compute.service';
import { Compute } from '../../../../../models/compute';


@Component({
    selector: 'app-cloud-nodes-add-template',
    templateUrl: './cloud-nodes-add-template.component.html',
    styleUrls: ['./cloud-nodes-add-template.component.scss', '../../../preferences.component.scss']
})
export class CloudNodesAddTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    formGroup: FormGroup;

    isGns3VmAvailable: boolean = false;
    isGns3VmChosen: boolean = false;
    isLocalComputerChosen: boolean = true;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private builtInTemplatesService: BuiltInTemplatesService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService,
        private formBuilder: FormBuilder,
        private computeService: ComputeService
    ) {
        this.formGroup = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.computeService.getComputes(server).subscribe((computes: Compute[]) => {
                if (computes.filter(compute => compute.compute_id === 'vm').length > 0) this.isGns3VmAvailable = true;
            });
        });
    }

    setServerType(serverType: string) {
        if (serverType === 'gns3 vm' && this.isGns3VmAvailable) {
            this.isGns3VmChosen = true;
            this.isLocalComputerChosen = false;
        } else {
            this.isGns3VmChosen = false;
            this.isLocalComputerChosen = true;
        }
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
            cloudTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';

            this.builtInTemplatesService.addTemplate(this.server, cloudTemplate).subscribe((cloudNodeTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
