import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Server } from '../../../../models/server';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerService } from '../../../../services/docker.service';
import { ServerService } from '../../../../services/server.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-docker-templates',
  templateUrl: './docker-templates.component.html',
  styleUrls: ['./docker-templates.component.scss', '../../preferences.component.scss'],
})
export class DockerTemplatesComponent implements OnInit {
  controller: Server;
  dockerTemplates: DockerTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private dockerService: DockerService,
    private router: Router
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;
      this.getTemplates();
    });
  }

  getTemplates() {
    this.dockerService.getTemplates(this.controller).subscribe((dockerTemplates: DockerTemplate[]) => {
      this.dockerTemplates = dockerTemplates.filter((elem) => elem.template_type === 'docker' && !elem.builtin);
    });
  }

  deleteTemplate(template: DockerTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }

  copyTemplate(template: DockerTemplate) {
    this.router.navigate([
      '/controller',
      this.controller.id,
      'preferences',
      'docker',
      'templates',
      template.template_id,
      'copy',
    ]);
  }
}
