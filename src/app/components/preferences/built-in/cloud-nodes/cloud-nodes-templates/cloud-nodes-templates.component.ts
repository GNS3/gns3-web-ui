import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { CloudTemplate } from '@models/templates/cloud-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cloud-nodes-templates',
  templateUrl: './cloud-nodes-templates.component.html',
  styleUrls: ['./cloud-nodes-templates.component.scss', '../../../preferences.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatTooltipModule, DeleteTemplateComponent, EmptyTemplatesListComponent]
})
export class CloudNodesTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  cloudNodesTemplates: CloudTemplate[] = [];
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
    this.builtInTemplatesService.getTemplates(this.controller).subscribe((cloudNodesTemplates: CloudTemplate[]) => {
      this.cloudNodesTemplates = cloudNodesTemplates.filter((elem) => elem.template_type === 'cloud' && !elem.builtin);
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: CloudTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
