import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Controller } from '../../../../models/controller';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { ControllerService } from '../../../../services/controller.service';
import { VmwareService } from '../../../../services/vmware.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-vmware-templates',
  templateUrl: './vmware-templates.component.html',
  styleUrls: ['./vmware-templates.component.scss', '../../preferences.component.scss'],
})
export class VmwareTemplatesComponent implements OnInit {
  controller:Controller ;
  vmwareTemplates: VmwareTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private vmwareService: VmwareService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.vmwareService.getTemplates(this.controller).subscribe((vmwareTemplates: VmwareTemplate[]) => {
      this.vmwareTemplates = vmwareTemplates.filter((elem) => elem.template_type === 'vmware' && !elem.builtin);
    });
  }

  deleteTemplate(template: VmwareTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
