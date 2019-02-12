import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerService } from '../../../../services/docker.service';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';


@Component({
    selector: 'app-docker-template-details',
    templateUrl: './docker-template-details.component.html',
    styleUrls: ['./docker-template-details.component.scss']
})
export class DockerTemplateDetailsComponent implements OnInit {
    server: Server;
    dockerTemplate: DockerTemplate;

    isSymbolSelectionOpened: boolean = false;

    consoleTypes: string[] = [];
    consoleResolutions: string[] = [];
    categories = [];
    adapters: CustomAdapter[] = [];
    displayedColumns: string[] = ['adapter_number', 'port_name'];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private dockerService: DockerService,
        private toasterService: ToasterService,
        private configurationService: DockerConfigurationService
    ){}

    ngOnInit(){
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            
            this.getConfiguration();
            this.dockerService.getTemplate(this.server, template_id).subscribe((dockerTemplate: DockerTemplate) => {
                this.dockerTemplate = dockerTemplate;
            });
        });
    }

    getConfiguration(){
        this.consoleTypes = this.configurationService.getConsoleTypes();
        this.categories = this.configurationService.getCategories();
        this.consoleResolutions = this.configurationService.getConsoleResolutions();
    }

    onSave(){
        this.dockerService.saveTemplate(this.server, this.dockerTemplate).subscribe((savedTemplate: DockerTemplate) => {
            this.toasterService.success("Changes saved");
        });
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.dockerTemplate.symbol = chosenSymbol;
    }
}
