import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../models/server';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ServerService } from '../../../../services/server.service';
import { VpcsService } from '../../../../services/vpcs.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-vpcs-templates',
  templateUrl: './vpcs-templates.component.html',
  styleUrls: ['./vpcs-templates.component.scss', '../../preferences.component.scss'],
})
export class VpcsTemplatesComponent implements OnInit {
  controller: Server;
  vpcsTemplates: VpcsTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(private route: ActivatedRoute, private serverService: ServerService, private vpcsService: VpcsService) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.vpcsService.getTemplates(this.controller).subscribe((vpcsTemplates: VpcsTemplate[]) => {
      this.vpcsTemplates = vpcsTemplates.filter((elem) => elem.template_type === 'vpcs' && !elem.builtin);
    });
  }

  deleteTemplate(template: VpcsTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
