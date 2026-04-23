import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
  ],
})
export class AddVmwareTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vmwareService = inject(VmwareService);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  readonly controller = signal<Controller | undefined>(undefined);
  readonly virtualMachines = signal<VmwareVm[]>([]);
  readonly selectedVM = signal<VmwareVm | undefined>(undefined);
  readonly vmwareTemplate = signal<VmwareTemplate>(<VmwareTemplate>{});

  // Form field signals
  templateName = model('');
  linkedClone = model(false);

  ngOnInit() {
    this.toasterService.error(
      `VMware VM support is deprecated and will be removed in a future version, please use Qemu VMs instead`
    );
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller.set(controller);
        this.cd.markForCheck();

        this.vmwareService.getVirtualMachines(this.controller()).subscribe({
          next: (virtualMachines: VmwareVm[]) => {
            this.virtualMachines.set(virtualMachines);
            this.cd.markForCheck();

            this.templateMocksService.getVmwareTemplate().subscribe({
              next: (template: VmwareTemplate) => {
                this.vmwareTemplate.set(template);
                this.cd.markForCheck();
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to load VMware template';
                this.toasterService.error(message);
                this.cd.markForCheck();
              },
            });
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load VMware VMs';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  goBack() {
    this.router.navigate(['/controller', this.controller().id, 'preferences', 'vmware', 'templates']);
  }

  addTemplate() {
    if (this.templateName() && this.selectedVM()) {
      const template = this.vmwareTemplate();
      template.name = this.selectedVM().vmname;
      template.vmx_path = this.selectedVM().vmx_path;
      template.linked_clone = this.linkedClone();
      template.template_id = uuid();

      this.vmwareService.addTemplate(this.controller(), template).subscribe({
        next: () => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add vmware template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
