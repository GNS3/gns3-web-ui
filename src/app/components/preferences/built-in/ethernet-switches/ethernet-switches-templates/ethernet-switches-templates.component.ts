import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '../../../../../models/controller';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ControllerService } from '../../../../../services/controller.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-ethernet-switches-templates',
  templateUrl: './ethernet-switches-templates.component.html',
  styleUrls: ['./ethernet-switches-templates.component.scss', '../../../preferences.component.scss'],
})
export class EthernetSwitchesTemplatesComponent implements OnInit {
  controller: Controller;
  ethernetSwitchesTemplates: EthernetSwitchTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private builtInTemplatesService: BuiltInTemplatesService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.builtInTemplatesService
      .getTemplates(this.controller)
      .subscribe((ethernetSwitchesTemplates: EthernetSwitchTemplate[]) => {
        this.ethernetSwitchesTemplates = ethernetSwitchesTemplates.filter(
          (elem) => elem.template_type === 'ethernet_switch' && !elem.builtin
        );
      });
  }

  deleteTemplate(template: EthernetSwitchTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
