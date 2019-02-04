import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';


@Component({
    selector: 'app-virtual-box-template-details',
    templateUrl: './virtual-box-template-details.component.html',
    styleUrls: ['./virtual-box-template-details.component.scss']
})
export class VirtualBoxTemplateDetailsComponent implements OnInit {
    server: Server;
    virtualBoxTemplate: VirtualBoxTemplate;

    isSymbolSelectionOpened: boolean = false;

    consoleTypes: string[] = ['telnet', 'none'];
    onCloseOptions = [["Power off the VM", "power_off"], 
                    ["Send the shutdown signal (ACPI)", "shutdown_signal"], 
                    ["Save the VM state", "save_vm_state"]];
    categories = [["Default", "guest"],
                    ["Routers", "routers"],
                    ["Switches", "switches"],
                    ["End devices", "end_devices"],
                    ["Security devices", "security_devices"]];
    networkTypes = ["PCnet-PCI II (Am79C970A)",
                    "PCNet-FAST III (Am79C973)",
                    "Intel PRO/1000 MT Desktop (82540EM)",
                    "Intel PRO/1000 T Server (82543GC)",
                    "Intel PRO/1000 MT Server (82545EM)",
                    "Paravirtualized Network (virtio-net)"];
    adapters: CustomAdapter[] = [];
    displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type'];
    isConfiguratorOpened: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private virtualBoxService: VirtualBoxService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

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

    configureCustomAdapters(){
        this.isConfiguratorOpened = !this.isConfiguratorOpened;
        this.virtualBoxTemplate.custom_adapters = this.adapters;
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
        this.virtualBoxTemplate.symbol = chosenSymbol;
    }
}
