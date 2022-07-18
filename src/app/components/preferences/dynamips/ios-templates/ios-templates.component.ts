import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Server } from '../../../../models/server';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { IosService } from '../../../../services/ios.service';
import { ServerService } from '../../../../services/server.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-ios-templates',
  templateUrl: './ios-templates.component.html',
  styleUrls: ['./ios-templates.component.scss', '../../preferences.component.scss'],
})
export class IosTemplatesComponent implements OnInit {
  server: Server;
  iosTemplates: IosTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private iosService: IosService,
    private router: Router
  ) {}

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.iosService.getTemplates(this.server).subscribe((templates: IosTemplate[]) => {
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
      this.server.id,
      'preferences',
      'dynamips',
      'templates',
      template.template_id,
      'copy',
    ]);
  }
}
