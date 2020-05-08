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
import { ComputeService } from '../../../../services/compute.service';
import { Compute } from '../../../../models/compute';


@Component({
    selector: 'app-add-vpcs-template',
    templateUrl: './add-vpcs-template.component.html',
    styleUrls: ['./add-vpcs-template.component.scss', '../../preferences.component.scss']
})
export class AddVpcsTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    templateNameForm: FormGroup

    isGns3VmAvailable: boolean = false;
    isGns3VmChosen: boolean = false;
    isLocalComputerChosen: boolean = true;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vpcsService: VpcsService,
        private router: Router,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService,
        private formBuilder: FormBuilder,
        private computeService: ComputeService
    ) {
        this.templateNameForm = this.formBuilder.group({
            templateName: new FormControl(null, [Validators.required])
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
            vpcsTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';

            this.vpcsService.addTemplate(this.server, vpcsTemplate).subscribe(() => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
