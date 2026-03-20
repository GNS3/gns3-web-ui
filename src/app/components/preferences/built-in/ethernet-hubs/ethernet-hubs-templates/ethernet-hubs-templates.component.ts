import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '@models/controller';
import { EthernetHubTemplate } from '@models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ethernet-hubs-templates',
  templateUrl: './ethernet-hubs-templates.component.html',
  styleUrls: ['./ethernet-hubs-templates.component.scss', '../../../preferences.component.scss'],
})
export class EthernetHubsTemplatesComponent implements OnInit {
  controller: Controller;
  ethernetHubsTemplates: EthernetHubTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private builtInTemplatesService: BuiltInTemplatesService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();
      this.getTemplates();
    });
  }

  getTemplates() {
    this.builtInTemplatesService.getTemplates(this.controller).subscribe((ethernetHubsTemplates: EthernetHubTemplate[]) => {
      this.ethernetHubsTemplates = ethernetHubsTemplates.filter(
        (elem) => elem.template_type === 'ethernet_hub' && !elem.builtin
      );
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: EthernetHubTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
