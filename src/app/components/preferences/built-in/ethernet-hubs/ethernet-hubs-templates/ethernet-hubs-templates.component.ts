import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { EthernetHubTemplate } from '@models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-hubs-templates',
  templateUrl: './ethernet-hubs-templates.component.html',
  styleUrls: ['./ethernet-hubs-templates.component.scss', '../../../preferences.component.scss'],
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
export class EthernetHubsTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  ethernetHubsTemplates: EthernetHubTemplate[] = [];
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
    this.builtInTemplatesService
      .getTemplates(this.controller)
      .subscribe((ethernetHubsTemplates: EthernetHubTemplate[]) => {
        this.ethernetHubsTemplates = ethernetHubsTemplates.filter(
          (elem) => elem.template_type === 'ethernet_hub' && !elem.builtin
        );
        this.cd.markForCheck();
      });
  }

  deleteTemplate(template: EthernetHubTemplate) {
    this.deleteComponent().deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
