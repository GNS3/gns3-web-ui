import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { QemuService } from '../../../../services/qemu.service';
import { Server } from '../../../../models/server';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { ToasterService } from '../../../../services/toaster.service';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';


@Component({
    selector: 'app-qemu-virtual-machine-template-details',
    templateUrl: './qemu-vm-template-details.component.html',
    styleUrls: ['./qemu-vm-template-details.component.scss', '../../preferences.component.scss']
})
export class QemuVmTemplateDetailsComponent implements OnInit {
    server: Server;
    qemuTemplate: QemuTemplate;

    isSymbolSelectionOpened: boolean = false;

    consoleTypes: string[] = [];
    diskInterfaces: string[] = [];
    networkTypes = [];
    bootPriorities = [];
    onCloseOptions = [];
    categories = [];
    priorities: string[] = [];
    binaries: QemuBinary[] = [];
    activateCpuThrottling: boolean = true;
    isConfiguratorOpened: boolean = false;
    adapters: CustomAdapter[] = [];
    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type'];

    generalSettingsForm: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private toasterService: ToasterService,
        private configurationService: QemuConfigurationService,
        private formBuilder: FormBuilder,
        private router: Router
    ){
        this.generalSettingsForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required),
            defaultName: new FormControl('', Validators.required),
            symbol: new FormControl('', Validators.required)
        });
    }

    ngOnInit(){
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            
            this.getConfiguration();
            this.qemuService.getTemplate(this.server, template_id).subscribe((qemuTemplate: QemuTemplate) => {
                this.qemuTemplate = qemuTemplate;

                this.qemuService.getBinaries(server).subscribe((qemuBinaries: QemuBinary[]) => {
                    this.binaries = qemuBinaries;
                });

                for(let i=0; i<this.qemuTemplate.adapters; i++){
                    let adapter = this.qemuTemplate.custom_adapters.find(elem => elem.adapter_number === i);
                    if (adapter) {
                        this.adapters.push(adapter);
                    } else {
                        this.adapters.push({
                            adapter_number: i,
                            adapter_type: this.qemuTemplate.adapter_type
                        });
                    }
                }
            });
        });
    }

    getConfiguration(){
        this.consoleTypes = this.configurationService.getConsoleTypes();
        this.diskInterfaces = this.configurationService.getDiskInterfaces();
        this.networkTypes = this.configurationService.getNetworkTypes();
        this.bootPriorities = this.configurationService.getBootPriorities();
        this.onCloseOptions = this.configurationService.getOnCloseOptions();
        this.categories = this.configurationService.getCategories();
        this.priorities = this.configurationService.getPriorities();
    }

    uploadCdromImageFile(event){
        this.qemuTemplate.cdrom_image = event.target.files[0].name;
    }

    uploadInitrdFile(event){
        this.qemuTemplate.initrd = event.target.files[0].name;
    }

    uploadKernelImageFile(event){
        this.qemuTemplate.kernel_image = event.target.files[0].name;
    }

    uploadBiosFile(event){
        this.qemuTemplate.bios_image = event.target.files[0].name;
    }

    cancelConfigureCustomAdapters(){
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
    }

    configureCustomAdapters(){
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
        this.qemuTemplate.custom_adapters = this.adapters;
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates']);
    }

    onSave(){
        if (this.generalSettingsForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            if (!this.activateCpuThrottling){
                this.qemuTemplate.cpu_throttling = 0;
            }
    
            this.qemuService.saveTemplate(this.server, this.qemuTemplate).subscribe((savedTemplate: QemuTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
        this.qemuTemplate.symbol = chosenSymbol;
    }
}
