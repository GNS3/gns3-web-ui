import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';
import { v4 as uuid } from 'uuid';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerService } from '../../../../services/docker.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';


@Component({
    selector: 'app-copy-docker-template',
    templateUrl: './copy-docker-template.component.html',
    styleUrls: ['./copy-docker-template.component.scss', '../../preferences.component.scss']
})
export class CopyDockerTemplateComponent implements OnInit {
    server: Server;
    templateName: string = '';
    dockerTemplate: DockerTemplate;
    templateNameForm: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private dockerService: DockerService,
        private toasterService: ToasterService,
        private router: Router,
        private formBuilder: FormBuilder
    ) {
        this.templateNameForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.dockerService.getTemplate(this.server, template_id).subscribe((dockerTemplate: DockerTemplate) => {
                this.dockerTemplate = dockerTemplate;
                this.templateName = `Copy of ${this.dockerTemplate.name}`;
            })

        });
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'docker', 'templates']);
    }

    addTemplate() {
        if (!this.templateNameForm.invalid) {
            this.dockerTemplate.template_id = uuid();
            this.dockerTemplate.name = this.templateName;

            this.dockerService.addTemplate(this.server, this.dockerTemplate).subscribe((template: DockerTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
