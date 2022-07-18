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
  server: Server;
  dockerTemplates: DockerTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private dockerService: DockerService,
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
    this.dockerService.getTemplates(this.server).subscribe((dockerTemplates: DockerTemplate[]) => {
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
      this.server.id,
      'preferences',
      'docker',
      'templates',
      template.template_id,
      'copy',
    ]);
  }
}
