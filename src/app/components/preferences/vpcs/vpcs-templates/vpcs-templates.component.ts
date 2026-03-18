import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ControllerService } from '@services/controller.service';
import { VpcsService } from '@services/vpcs.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-vpcs-templates',
  templateUrl: './vpcs-templates.component.html',
  styleUrls: ['./vpcs-templates.component.scss', '../../preferences.component.scss'],
})
export class VpcsTemplatesComponent implements OnInit {
  controller: Controller;
  vpcsTemplates: VpcsTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(private route: ActivatedRoute, private controllerService: ControllerService, private vpcsService: VpcsService) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
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
