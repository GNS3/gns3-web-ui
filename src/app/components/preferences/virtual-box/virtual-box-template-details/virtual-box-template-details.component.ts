import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { VirtualBoxConfigurationService } from '../../../../services/virtual-box-configuration.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';


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
    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type'];
    isConfiguratorOpened: boolean = false;
    generalSettingsForm: FormGroup;
    networkForm: FormGroup

    @ViewChild("customAdaptersConfigurator", {static: false}) 
        customAdaptersConfigurator: CustomAdaptersComponent;

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
                this.fillCustomAdapters();
            });
        });
    }

    getConfiguration(){
        this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
        this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
        this.categories = this.virtualBoxConfigurationService.getCategories();
        this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
    }

    setCustomAdaptersConfiguratorState(state: boolean) {
        this.isConfiguratorOpened = state;

        if (state) {
            this.fillCustomAdapters();
            this.customAdaptersConfigurator.numberOfAdapters = this.virtualBoxTemplate.adapters;
            this.customAdaptersConfigurator.adapters = [];
            this.virtualBoxTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
                this.customAdaptersConfigurator.adapters.push({
                    adapter_number: adapter.adapter_number,
                    adapter_type: adapter.adapter_type
                });
            });
        }
    }

    saveCustomAdapters(adapters: CustomAdapter[]){
        this.setCustomAdaptersConfiguratorState(false);
        this.virtualBoxTemplate.custom_adapters = adapters;
    }

    fillCustomAdapters() {
        let copyOfAdapters = this.virtualBoxTemplate.custom_adapters ? this.virtualBoxTemplate.custom_adapters : [];
        this.virtualBoxTemplate.custom_adapters = [];

        for(let i=0; i<this.virtualBoxTemplate.adapters; i++){
            if (copyOfAdapters[i]) {
                this.virtualBoxTemplate.custom_adapters.push(copyOfAdapters[i]);
            } else {
                this.virtualBoxTemplate.custom_adapters.push({
                    adapter_number: i,
                    adapter_type: 'e1000'
                });
            }
        }
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'virtualbox', 'templates']);
    }

    onSave() {
        if (this.generalSettingsForm.invalid || this.networkForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.fillCustomAdapters();

            this.virtualBoxService.saveTemplate(this.server, this.virtualBoxTemplate).subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
        this.virtualBoxTemplate.symbol = chosenSymbol;
    }
}
