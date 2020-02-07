import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Server } from '../../../../models/server';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { VirtualBoxVm } from '../../../../models/virtualBox/virtual-box-vm';
import { ServerService } from '../../../../services/server.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { VirtualBoxService } from '../../../../services/virtual-box.service';


@Component({
    selector: 'app-add-virtual-box-template',
    templateUrl: './add-virtual-box-template.component.html',
    styleUrls: ['./add-virtual-box-template.component.scss', '../../preferences.component.scss']
})
export class AddVirtualBoxTemplateComponent implements OnInit {
    server: Server;
    virtualMachines: VirtualBoxVm[];
    selectedVM: VirtualBoxVm;
    virtualBoxTemplate: VirtualBoxTemplate;
    vmForm: FormGroup;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private virtualBoxService: VirtualBoxService,
        private toasterService: ToasterService,
        private templateMocksService: TemplateMocksService,
        private router: Router,
        private formBuilder: FormBuilder
    ) {
        this.vmForm = this.formBuilder.group({
            vm: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.virtualBoxService.getVirtualMachines(this.server).subscribe((virtualMachines: VirtualBoxVm[]) => {
                this.virtualMachines = virtualMachines;

                this.templateMocksService.getVirtualBoxTemplate().subscribe((template: VirtualBoxTemplate) => {
                    this.virtualBoxTemplate = template;
                });
            });
        });
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'virtualbox', 'templates']);
    }

    addTemplate() {
        if (!this.vmForm.invalid) {
            this.virtualBoxTemplate.name = this.selectedVM.vmname;
            this.virtualBoxTemplate.vmname = this.selectedVM.vmname;
            this.virtualBoxTemplate.ram = this.selectedVM.ram;
            this.virtualBoxTemplate.template_id = uuid();

            this.virtualBoxService.addTemplate(this.server, this.virtualBoxTemplate).subscribe(() => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }
}
