import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import{ Controller } from '../../../../models/controller';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { IosService } from '../../../../services/ios.service';
import { ControllerService } from '../../../../services/controller.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-ios-templates',
  templateUrl: './ios-templates.component.html',
  styleUrls: ['./ios-templates.component.scss', '../../preferences.component.scss'],
})
export class IosTemplatesComponent implements OnInit {
  controller:Controller ;
  iosTemplates: IosTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iosService: IosService,
    private router: Router
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.iosService.getTemplates(this.controller).subscribe((templates: IosTemplate[]) => {
      this.iosTemplates = templates.filter((elem) => elem.template_type === 'dynamips' && !elem.builtin);
    });
  }

  deleteTemplate(template: VpcsTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }

  copyTemplate(template: IosTemplate) {
    this.router.navigate([
      '/controller',
      this.controller.id,
      'preferences',
      'dynamips',
      'templates',
      template.template_id,
      'copy',
    ]);
  }
}
