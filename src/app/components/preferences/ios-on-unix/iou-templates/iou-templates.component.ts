import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';
import { IouService } from '@services/iou.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-iou-templates',
  templateUrl: './iou-templates.component.html',
  styleUrls: ['./iou-templates.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    DeleteTemplateComponent,
    EmptyTemplatesListComponent,
  ],
})
export class IouTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iouService = inject(IouService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  iouTemplates: IouTemplate[] = [];
  readonly deleteComponent = viewChild(DeleteTemplateComponent);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();
      this.getTemplates();
    });
  }

  getTemplates() {
    this.iouService.getTemplates(this.controller).subscribe((iouTemplates: IouTemplate[]) => {
      this.iouTemplates = iouTemplates.filter((elem) => elem.template_type === 'iou' && !elem.builtin);
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: IouTemplate) {
    this.deleteComponent().deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }

  copyTemplate(template: IouTemplate) {
    this.router.navigate([
      '/controller',
      this.controller.id,
      'preferences',
      'iou',
      'templates',
      template.template_id,
      'copy',
    ]);
  }
}
