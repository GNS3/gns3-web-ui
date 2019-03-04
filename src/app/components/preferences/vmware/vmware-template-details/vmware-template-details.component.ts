import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareService } from '../../../../services/vmware.service';
import { VmwareConfigurationService } from '../../../../services/vmware-configuration.service';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';


@Component({
    selector: 'app-vmware-template-details',
    templateUrl: './vmware-template-details.component.html',
    styleUrls: ['./vmware-template-details.component.scss', '../../preferences.component.scss']
})
export class VmwareTemplateDetailsComponent implements OnInit {
    server: Server;
    vmwareTemplate: VmwareTemplate;
    generalSettingsForm: FormGroup;
    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type'];
    isConfiguratorOpened: boolean = false;
    isSymbolSelectionOpened: boolean = false;
    consoleTypes: string[] = [];
    categories = [];
    onCloseOptions = [];
    networkTypes = [];

    @ViewChild("customAdaptersConfigurator") 
        customAdaptersConfigurator: CustomAdaptersComponent;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vmwareService: VmwareService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private vmwareConfigurationService: VmwareConfigurationService,
        private router: Router
    ) {
        this.generalSettingsForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required),
            defaultName: new FormControl('', Validators.required),
            symbol: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.getConfiguration();
            this.vmwareService.getTemplate(this.server, template_id).subscribe((vmwareTemplate: VmwareTemplate) => {
                this.vmwareTemplate = vmwareTemplate;
                this.fillCustomAdapters();
            });
        });
    }

    getConfiguration() {
        this.consoleTypes = this.vmwareConfigurationService.getConsoleTypes();
        this.categories = this.vmwareConfigurationService.getCategories();
        this.onCloseOptions = this.vmwareConfigurationService.getOnCloseoptions();
        this.networkTypes = this.vmwareConfigurationService.getNetworkTypes();
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'vmware', 'templates']);
    }

    onSave() {
        if (this.generalSettingsForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.fillCustomAdapters();

            this.vmwareService.saveTemplate(this.server, this.vmwareTemplate).subscribe((vmwareTemplate: VmwareTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }

    setCustomAdaptersConfiguratorState(state: boolean) {
        this.isConfiguratorOpened = state;

        if (state) {
            this.fillCustomAdapters();
            this.customAdaptersConfigurator.numberOfAdapters = this.vmwareTemplate.adapters;
            this.customAdaptersConfigurator.adapters = [];
            this.vmwareTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
                this.customAdaptersConfigurator.adapters.push({
                    adapter_number: adapter.adapter_number,
                    adapter_type: adapter.adapter_type
                });
            });
        }
    }

    saveCustomAdapters(adapters: CustomAdapter[]){
        this.setCustomAdaptersConfiguratorState(false);
        this.vmwareTemplate.custom_adapters = adapters;
    }

    fillCustomAdapters() {
        let copyOfAdapters = this.vmwareTemplate.custom_adapters ? this.vmwareTemplate.custom_adapters : [];
        this.vmwareTemplate.custom_adapters = [];

        for(let i=0; i<this.vmwareTemplate.adapters; i++){
            if (copyOfAdapters[i]) {
                this.vmwareTemplate.custom_adapters.push(copyOfAdapters[i]);
            } else {
                this.vmwareTemplate.custom_adapters.push({
                    adapter_number: i,
                    adapter_type: 'e1000'
                });
            }
        }
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.vmwareTemplate.symbol = chosenSymbol;
    }
}
