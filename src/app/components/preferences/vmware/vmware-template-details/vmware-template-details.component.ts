import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareService } from '../../../../services/vmware.service';
import { VmwareConfigurationService } from '../../../../services/vmware-configuration.service';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';


@Component({
    selector: 'app-vmware-template-details',
    templateUrl: './vmware-template-details.component.html',
    styleUrls: ['./vmware-template-details.component.scss']
})
export class VmwareTemplateDetailsComponent implements OnInit {
    server: Server;
    vmwareTemplate: VmwareTemplate;
    inputForm: FormGroup;

    adapters: CustomAdapter[] = [];
    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type'];
    isConfiguratorOpened: boolean = false;
    isSymbolSelectionOpened: boolean = false;

    consoleTypes: string[] = [];
    categories = [];
    onCloseOptions = [];
    networkTypes = [];

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private vmwareService: VmwareService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private vmwareConfigurationService: VmwareConfigurationService
    ) {
        this.inputForm = this.formBuilder.group({
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
            });
        });
    }

    getConfiguration() {
        this.consoleTypes = this.vmwareConfigurationService.getConsoleTypes();
        this.categories = this.vmwareConfigurationService.getCategories();
        this.onCloseOptions = this.vmwareConfigurationService.getOnCloseoptions();
        this.networkTypes = this.vmwareConfigurationService.getNetworkTypes();
    }

    onSave() {
        if (this.inputForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.vmwareService.saveTemplate(this.server, this.vmwareTemplate).subscribe((vmwareTemplate: VmwareTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }

    configureCustomAdapters() {
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
        this.adapters = [];

        let adapters: CustomAdapter[] = [];
        for (let i=0; i<this.vmwareTemplate.adapters; i++){
            if (this.vmwareTemplate.custom_adapters[i]) {
                adapters.push(this.vmwareTemplate.custom_adapters[i]);
            } else {
                adapters.push({
                    adapter_number: i,
                    adapter_type: 'e1000'
                });
            }
        }
        this.adapters = adapters;
    }

    saveCustomAdapters() {
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
        this.vmwareTemplate.custom_adapters = this.adapters;
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.vmwareTemplate.symbol = chosenSymbol;
    }
}
