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
export class AddVirtualBoxTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private virtualBoxService = inject(VirtualBoxService);
  private toasterService = inject(ToasterService);
  private templateMocksService = inject(TemplateMocksService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  readonly controller = signal<Controller | undefined>(undefined);
  readonly virtualMachines = signal<VirtualBoxVm[]>([]);
  readonly selectedVM = signal<VirtualBoxVm | undefined>(undefined);
  readonly virtualBoxTemplate = signal<VirtualBoxTemplate>(<VirtualBoxTemplate>{});

  // Form field signals
  vm = model<VirtualBoxVm | ''>('');
  linkedClone = model(false);

  ngOnInit() {
    setTimeout(() => {
      this.toasterService.error(
        `VirtualBox VM support is deprecated and will be removed in a future version, please use Qemu VMs instead`
      );
    });
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller.set(controller);
        this.cd.markForCheck();

        this.virtualBoxService.getVirtualMachines(this.controller()).subscribe({
          next: (virtualMachines: VirtualBoxVm[]) => {
            this.virtualMachines.set(virtualMachines);
            this.cd.markForCheck();

            this.templateMocksService.getVirtualBoxTemplate().subscribe({
              next: (template: VirtualBoxTemplate) => {
                this.virtualBoxTemplate.set(template);
                this.cd.markForCheck();
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to load VirtualBox template';
                this.toasterService.error(message);
                this.cd.markForCheck();
              },
            });
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load VirtualBox VMs';
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
    this.router.navigate(['/controller', this.controller().id, 'preferences', 'virtualbox', 'templates']);
  }

  addTemplate() {
    if (this.vm()) {
      const template = this.virtualBoxTemplate();
      template.name = this.selectedVM().vmname;
      template.vmname = this.selectedVM().vmname;
      template.ram = this.selectedVM().ram;
      template.linked_clone = this.linkedClone();
      template.template_id = uuid();

      this.virtualBoxService.addTemplate(this.controller(), template).subscribe({
        next: () => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add virtual box template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
