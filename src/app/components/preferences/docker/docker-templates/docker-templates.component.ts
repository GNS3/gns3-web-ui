import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docker-templates',
  templateUrl: './docker-templates.component.html',
  styleUrls: ['./docker-templates.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatTooltipModule, DeleteTemplateComponent, EmptyTemplatesListComponent]
})
export class DockerTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dockerService = inject(DockerService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  dockerTemplates: DockerTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();
      this.getTemplates();
    });
  }

  getTemplates() {
    this.dockerService.getTemplates(this.controller).subscribe((dockerTemplates: DockerTemplate[]) => {
      this.dockerTemplates = dockerTemplates.filter((elem) => elem.template_type === 'docker' && !elem.builtin);
      this.cd.markForCheck();
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
