import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';

@Component({
  standalone: true,
  selector: 'app-ios-templates',
  templateUrl: './ios-templates.component.html',
  styleUrls: ['./ios-templates.component.scss', '../../preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class IosTemplatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  iosTemplates: IosTemplate[] = [];
  readonly deleteComponent = viewChild(DeleteTemplateComponent);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();
        this.getTemplates();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  getTemplates() {
    this.iosService.getTemplates(this.controller).subscribe({
      next: (templates: IosTemplate[]) => {
        this.iosTemplates = templates.filter((elem) => elem.template_type === 'dynamips' && !elem.builtin);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load templates';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  deleteTemplate(template: VpcsTemplate) {
    this.deleteComponent().deleteItem(template.name, template.template_id);
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
