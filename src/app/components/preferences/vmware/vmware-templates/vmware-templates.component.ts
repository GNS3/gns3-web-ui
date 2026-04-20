import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { ControllerService } from '@services/controller.service';
import { VmwareService } from '@services/vmware.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vmware-templates',
  templateUrl: './vmware-templates.component.html',
  styleUrls: ['./vmware-templates.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    DeleteTemplateComponent,
    EmptyTemplatesListComponent,
  ],
})
export class VmwareTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vmwareService = inject(VmwareService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  vmwareTemplates: VmwareTemplate[] = [];
  readonly deleteComponent = viewChild(DeleteTemplateComponent);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();
      this.getTemplates();
    });
  }

  getTemplates() {
    this.vmwareService.getTemplates(this.controller).subscribe((vmwareTemplates: VmwareTemplate[]) => {
      this.vmwareTemplates = vmwareTemplates.filter((elem) => elem.template_type === 'vmware' && !elem.builtin);
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: VmwareTemplate) {
    this.deleteComponent().deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
