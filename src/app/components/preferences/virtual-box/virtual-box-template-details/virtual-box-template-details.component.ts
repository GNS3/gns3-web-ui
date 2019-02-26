import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { VirtualBoxConfigurationService } from '../../../../services/virtual-box-configuration.service';


@Component({
    selector: 'app-virtual-box-template-details',
    templateUrl: './virtual-box-template-details.component.html',
    styleUrls: ['./virtual-box-template-details.component.scss', '../../preferences.component.scss']
})
export class VirtualBoxTemplateDetailsComponent implements OnInit {
    server: Server;
    virtualBoxTemplate: VirtualBoxTemplate;

    isSymbolSelectionOpened: boolean = false;

    consoleTypes: string[] = [];
    onCloseOptions = [];
    categories = [];
    networkTypes = [];
    adapters: CustomAdapter[] = [];
    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type'];
    isConfiguratorOpened: boolean = false;

    generalSettingsForm: FormGroup;
    networkForm: FormGroup

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private virtualBoxService: VirtualBoxService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private virtualBoxConfigurationService: VirtualBoxConfigurationService,
        private router: Router
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required),
            defaultName: new FormControl('', Validators.required),
            symbol: new FormControl('', Validators.required),
            ram: new FormControl('', Validators.required)
        });

        this.networkForm = this.formBuilder.group({
            adapters: new FormControl('', Validators.required),
            nameFormat: new FormControl('', Validators.required),
            size: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.getConfiguration();
            this.virtualBoxService.getTemplate(this.server, template_id).subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
                this.virtualBoxTemplate = virtualBoxTemplate;

                for(let i=0; i<this.virtualBoxTemplate.adapters; i++){
                    let adapter = this.virtualBoxTemplate.custom_adapters.find(elem => elem.adapter_number === i);
                    if (adapter) {
                        this.adapters.push(adapter);
                    } else {
                        this.adapters.push({
                            adapter_number: i,
                            adapter_type: this.virtualBoxTemplate.adapter_type
                        });
                    }
                }
            });
        });
    }

    getConfiguration(){
        this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
        this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
        this.categories = this.virtualBoxConfigurationService.getCategories();
        this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
    }

    configureCustomAdapters(){
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
        this.virtualBoxTemplate.custom_adapters = this.adapters;
    }

    cancelConfigureCustomAdapters(){
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'virtualbox', 'templates']);
    }

    onSave() {
        this.virtualBoxService.saveTemplate(this.server, this.virtualBoxTemplate).subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
            this.toasterService.success("Changes saved");
        });
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
        this.virtualBoxTemplate.symbol = chosenSymbol;
    }
}
