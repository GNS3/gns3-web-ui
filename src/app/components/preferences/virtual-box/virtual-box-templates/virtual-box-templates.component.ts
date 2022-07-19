import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../models/server';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ServerService } from '../../../../services/server.service';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-virtual-box-templates',
  templateUrl: './virtual-box-templates.component.html',
  styleUrls: ['./virtual-box-templates.component.scss', '../../preferences.component.scss'],
})
export class VirtualBoxTemplatesComponent implements OnInit {
  server: Server;
  virtualBoxTemplates: VirtualBoxTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private virtualBoxService: VirtualBoxService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((server: Server) => {
      this.server = server;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.virtualBoxService.getTemplates(this.server).subscribe((virtualBoxTemplates: VirtualBoxTemplate[]) => {
      this.virtualBoxTemplates = virtualBoxTemplates.filter(
        (elem) => elem.template_type === 'virtualbox' && !elem.builtin
      );
    });
  }

  deleteTemplate(template: VpcsTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
