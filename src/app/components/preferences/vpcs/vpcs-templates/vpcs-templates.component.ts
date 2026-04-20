import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ControllerService } from '@services/controller.service';
import { VpcsService } from '@services/vpcs.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vpcs-templates',
  templateUrl: './vpcs-templates.component.html',
  styleUrls: ['./vpcs-templates.component.scss', '../../preferences.component.scss'],
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
export class VpcsTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vpcsService = inject(VpcsService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  vpcsTemplates: VpcsTemplate[] = [];
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
    this.vpcsService.getTemplates(this.controller).subscribe((vpcsTemplates: VpcsTemplate[]) => {
      this.vpcsTemplates = vpcsTemplates.filter((elem) => elem.template_type === 'vpcs' && !elem.builtin);
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: VpcsTemplate) {
    this.deleteComponent().deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
