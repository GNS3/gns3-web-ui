import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qemu-virtual-machines-templates',
  templateUrl: './qemu-vm-templates.component.html',
  styleUrls: ['./qemu-vm-templates.component.scss', '../../preferences.component.scss'],
})
export class QemuVmTemplatesComponent implements OnInit {
  controller: Controller;
  qemuTemplates: QemuTemplate[] = [];
  @ViewChild(DeleteTemplateComponent) deleteComponent: DeleteTemplateComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private qemuService: QemuService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();
      this.getTemplates();
    });
  }

  getTemplates() {
    this.qemuService.getTemplates(this.controller).subscribe((qemuTemplates: QemuTemplate[]) => {
      this.qemuTemplates = qemuTemplates.filter((elem) => elem.template_type === 'qemu' && !elem.builtin);
      this.cd.markForCheck();
    });
  }

  deleteTemplate(template: QemuTemplate) {
    this.deleteComponent.deleteItem(template.name, template.template_id);
  }

  onDeleteEvent() {
    this.getTemplates();
  }

  copyTemplate(template: QemuTemplate) {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'qemu', 'templates', template.template_id, 'copy']);
  }
}
