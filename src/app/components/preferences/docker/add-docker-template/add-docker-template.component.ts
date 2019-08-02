import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerService } from '../../../../services/docker.service';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { DockerImage } from '../../../../models/docker/docker-image';


@Component({
    selector: 'app-add-docker-template',
    templateUrl: './add-docker-template.component.html',
    styleUrls: ['./add-docker-template.component.scss', '../../preferences.component.scss']
})
export class AddDockerTemplateComponent implements OnInit {
    server: Server;
    dockerTemplate: DockerTemplate;
    consoleTypes: string[] = [];
    isGns3VmChosen: boolean = false;
    isRemoteComputerChosen: boolean = false;
    dockerImages: DockerImage[] = [];
    newImageSelected: boolean = false;

    virtualMachineForm: FormGroup;
    containerNameForm: FormGroup;
    networkAdaptersForm: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private dockerService: DockerService,
        private toasterService: ToasterService,
        private router: Router,
        private formBuilder: FormBuilder,
        private templateMocksService: TemplateMocksService,
        private configurationService: DockerConfigurationService
    ) {
        this.dockerTemplate = new DockerTemplate();

        this.virtualMachineForm = this.formBuilder.group({
            filename: new FormControl('', Validators.required)
        });

        this.containerNameForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });

        this.networkAdaptersForm = this.formBuilder.group({
            adapters: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.consoleTypes = this.configurationService.getConsoleTypes();

            this.templateMocksService.getDockerTemplate().subscribe((dockerTemplate: DockerTemplate) => {
                this.dockerTemplate = dockerTemplate;
            })
        });
    }

    setServerType(serverType: string) {
        if (serverType === 'gns3 vm') {
            this.isGns3VmChosen = true;
        } else {
            this.isRemoteComputerChosen = true;
        }
    }

    setDiskImage(value: string) {
        this.newImageSelected = value === "newImage";
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'docker', 'templates']);
    }

    addTemplate() {
        if ((!this.virtualMachineForm.invalid || !this.newImageSelected) && !this.containerNameForm.invalid && !this.networkAdaptersForm.invalid) {
            this.dockerTemplate.template_id = uuid();
            this.dockerTemplate.image = this.virtualMachineForm.get('filename').value;
            this.dockerTemplate.name = this.containerNameForm.get('templateName').value;
            this.dockerTemplate.adapters = this.networkAdaptersForm.get('adapters').value;

            this.dockerService.addTemplate(this.server, this.dockerTemplate).subscribe((template: DockerTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
