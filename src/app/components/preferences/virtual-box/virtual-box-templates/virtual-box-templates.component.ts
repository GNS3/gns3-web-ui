import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ControllerService } from '@services/controller.service';
import { VirtualBoxService } from '@services/virtual-box.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-virtual-box-templates',
  templateUrl: './virtual-box-templates.component.html',
  styleUrls: ['./virtual-box-templates.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatTooltipModule, DeleteTemplateComponent, EmptyTemplatesListComponent]
})
export class VirtualBoxTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private virtualBoxService = inject(VirtualBoxService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  virtualBoxTemplates: VirtualBoxTemplate[] = [];
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
    this.virtualBoxService.getTemplates(this.controller).subscribe((virtualBoxTemplates: VirtualBoxTemplate[]) => {
      this.virtualBoxTemplates = virtualBoxTemplates.filter(
        (elem) => elem.template_type === 'virtualbox' && !elem.builtin
      );
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: VpcsTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }
}
