import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import{ Controller } from '../../../../models/controller';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuService } from '../../../../services/qemu.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-copy-qemu-virtual-machine-template',
  templateUrl: './copy-qemu-vm-template.component.html',
  styleUrls: ['./copy-qemu-vm-template.component.scss', '../../preferences.component.scss'],
})
export class CopyQemuVmTemplateComponent implements OnInit {
  controller:Controller ;
  qemuBinaries: QemuBinary[] = [];
  templateName: string = '';
  qemuTemplate: QemuTemplate;
  nameForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private serverService: ControllerService,
    private qemuService: QemuService,
    private toasterService: ToasterService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.nameForm = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.qemuService.getTemplate(this.controller, template_id).subscribe((qemuTemplate: QemuTemplate) => {
        this.qemuTemplate = qemuTemplate;
        this.templateName = `Copy of ${this.qemuTemplate.name}`;
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'qemu', 'templates']);
  }

  addTemplate() {
    if (!this.nameForm.invalid) {
      this.qemuTemplate.template_id = uuid();
      this.qemuTemplate.name = this.templateName;

      this.qemuService.addTemplate(this.controller, this.qemuTemplate).subscribe((template: QemuTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
