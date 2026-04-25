import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../../common/empty-templates-list/empty-templates-list.component';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-switches-templates',
  templateUrl: './ethernet-switches-templates.component.html',
  styleUrl: './ethernet-switches-templates.component.scss',
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
export class EthernetSwitchesTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  ethernetSwitchesTemplates: EthernetSwitchTemplate[] = [];
  readonly deleteComponent = viewChild(DeleteTemplateComponent);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();
        this.getTemplates();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  getTemplates() {
    this.builtInTemplatesService.getTemplates(this.controller).subscribe({
      next: (ethernetSwitchesTemplates: EthernetSwitchTemplate[]) => {
        this.ethernetSwitchesTemplates = ethernetSwitchesTemplates.filter(
          (elem) => elem.template_type === 'ethernet_switch' && !elem.builtin
        );
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load templates';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  deleteTemplate(template: EthernetSwitchTemplate) {
    this.deleteComponent().deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
