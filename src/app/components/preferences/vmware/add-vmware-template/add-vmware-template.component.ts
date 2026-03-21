import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { VmwareVm } from '@models/vmware/vmware-vm';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { VmwareService } from '@services/vmware.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-vmware-template',
  templateUrl: './add-vmware-template.component.html',
  styleUrls: ['./add-vmware-template.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatSelectModule, MatCheckboxModule, MatFormFieldModule]
})
export class AddVmwareTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vmwareService = inject(VmwareService);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private router = inject(Router);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  virtualMachines: VmwareVm[];
  selectedVM: VmwareVm;
  vmwareTemplate: VmwareTemplate;
  templateNameForm: UntypedFormGroup;

  constructor() {
    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    this.toasterService.error(`VMware VM support is deprecated and will be removed in a future version, please use Qemu VMs instead`);
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.vmwareService.getVirtualMachines(this.controller).subscribe((virtualMachines: VmwareVm[]) => {
        this.virtualMachines = virtualMachines;
        this.cd.markForCheck();

        this.templateMocksService.getVmwareTemplate().subscribe((template: VmwareTemplate) => {
          this.vmwareTemplate = template;
          this.cd.markForCheck();
        });
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'vmware', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.vmwareTemplate.name = this.selectedVM.vmname;
      this.vmwareTemplate.vmx_path = this.selectedVM.vmx_path;
      this.vmwareTemplate.template_id = uuid();

      this.vmwareService.addTemplate(this.controller, this.vmwareTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
