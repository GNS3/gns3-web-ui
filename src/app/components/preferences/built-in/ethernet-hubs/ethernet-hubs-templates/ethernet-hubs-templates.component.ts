import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../../models/server';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ServerService } from '../../../../../services/server.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-ethernet-hubs-templates',
  templateUrl: './ethernet-hubs-templates.component.html',
  styleUrls: ['./ethernet-hubs-templates.component.scss', '../../../preferences.component.scss'],
})
export class EthernetHubsTemplatesComponent implements OnInit {
  controller: Server;
  ethernetHubsTemplates: EthernetHubTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private builtInTemplatesService: BuiltInTemplatesService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.builtInTemplatesService.getTemplates(this.controller).subscribe((ethernetHubsTemplates: EthernetHubTemplate[]) => {
      this.ethernetHubsTemplates = ethernetHubsTemplates.filter(
        (elem) => elem.template_type === 'ethernet_hub' && !elem.builtin
      );
    });
  }

  deleteTemplate(template: EthernetHubTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
