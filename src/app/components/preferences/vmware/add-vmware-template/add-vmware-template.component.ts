import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Server } from '../../../../models/server';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareVm } from '../../../../models/vmware/vmware-vm';
import { ServerService } from '../../../../services/server.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { VmwareService } from '../../../../services/vmware.service';

@Component({
  selector: 'app-add-vmware-template',
  templateUrl: './add-vmware-template.component.html',
  styleUrls: ['./add-vmware-template.component.scss', '../../preferences.component.scss'],
})
export class AddVmwareTemplateComponent implements OnInit {
  server: Server;
  virtualMachines: VmwareVm[];
  selectedVM: VmwareVm;
  vmwareTemplate: VmwareTemplate;
  templateNameForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private vmwareService: VmwareService,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.templateNameForm = this.formBuilder.group({
      templateName: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;

      this.vmwareService.getVirtualMachines(this.server).subscribe((virtualMachines: VmwareVm[]) => {
        this.virtualMachines = virtualMachines;

        this.templateMocksService.getVmwareTemplate().subscribe((template: VmwareTemplate) => {
          this.vmwareTemplate = template;
        });
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.server.id, 'preferences', 'vmware', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.vmwareTemplate.name = this.selectedVM.vmname;
      this.vmwareTemplate.vmx_path = this.selectedVM.vmx_path;
      this.vmwareTemplate.template_id = uuid();

      this.vmwareService.addTemplate(this.server, this.vmwareTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
