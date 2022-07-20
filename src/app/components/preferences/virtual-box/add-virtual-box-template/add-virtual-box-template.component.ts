import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./add-virtual-box-template.component.scss', '../../preferences.component.scss'],
})
export class AddVirtualBoxTemplateComponent implements OnInit {
  controller: Server;
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
      vm: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;

      this.virtualBoxService.getVirtualMachines(this.controller).subscribe((virtualMachines: VirtualBoxVm[]) => {
        this.virtualMachines = virtualMachines;

        this.templateMocksService.getVirtualBoxTemplate().subscribe((template: VirtualBoxTemplate) => {
          this.virtualBoxTemplate = template;
        });
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'virtualbox', 'templates']);
  }

  addTemplate() {
    if (!this.vmForm.invalid) {
      this.virtualBoxTemplate.name = this.selectedVM.vmname;
      this.virtualBoxTemplate.vmname = this.selectedVM.vmname;
      this.virtualBoxTemplate.ram = this.selectedVM.ram;
      this.virtualBoxTemplate.template_id = uuid();

      this.virtualBoxService.addTemplate(this.controller, this.virtualBoxTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
