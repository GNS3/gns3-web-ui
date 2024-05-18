import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Controller } from '../../../../models/controller';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerService } from '../../../../services/docker.service';
import { ControllerService } from '../../../../services/controller.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  selector: 'app-docker-templates',
  templateUrl: './docker-templates.component.html',
  styleUrls: ['./docker-templates.component.scss', '../../preferences.component.scss'],
})
export class DockerTemplatesComponent implements OnInit {
  controller:Controller ;
  dockerTemplates: DockerTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private dockerService: DockerService,
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
