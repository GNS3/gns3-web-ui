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
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { VirtualBoxVm } from '@models/virtualBox/virtual-box-vm';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { VirtualBoxService } from '@services/virtual-box.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-virtual-box-template',
  templateUrl: './add-virtual-box-template.component.html',
  styleUrls: ['./add-virtual-box-template.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatSelectModule, MatCheckboxModule, MatFormFieldModule]
})
export class AddVirtualBoxTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private virtualBoxService = inject(VirtualBoxService);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private router = inject(Router);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  virtualMachines: VirtualBoxVm[];
  selectedVM: VirtualBoxVm;
  virtualBoxTemplate: VirtualBoxTemplate;
  vmForm: UntypedFormGroup;

  constructor() {
    this.vmForm = this.formBuilder.group({
      vm: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.toasterService.error(`VirtualBox VM support is deprecated and will be removed in a future version, please use Qemu VMs instead`);
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.virtualBoxService.getVirtualMachines(this.controller).subscribe((virtualMachines: VirtualBoxVm[]) => {
        this.virtualMachines = virtualMachines;
        this.cd.markForCheck();

        this.templateMocksService.getVirtualBoxTemplate().subscribe((template: VirtualBoxTemplate) => {
          this.virtualBoxTemplate = template;
          this.cd.markForCheck();
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
