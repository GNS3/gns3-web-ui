import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '../../../../../models/controller';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ControllerService } from '../../../../../services/controller.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-cloud-nodes-templates',
  templateUrl: './cloud-nodes-templates.component.html',
  styleUrls: ['./cloud-nodes-templates.component.scss', '../../../preferences.component.scss'],
})
export class CloudNodesTemplatesComponent implements OnInit {
  controller: Controller;
  cloudNodesTemplates: CloudTemplate[] = [];
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
    this.builtInTemplatesService.getTemplates(this.controller).subscribe((cloudNodesTemplates: CloudTemplate[]) => {
      this.cloudNodesTemplates = cloudNodesTemplates.filter((elem) => elem.template_type === 'cloud' && !elem.builtin);
    });
  }

  deleteTemplate(template: CloudTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
