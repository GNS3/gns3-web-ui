import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'environments/environment';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { Project } from '../../../models/project';
import { Controller } from '../../../models/controller';
import { DockerTemplate } from '../../../models/templates/docker-template';
import { IosTemplate } from '../../../models/templates/ios-template';
import { IouTemplate } from '../../../models/templates/iou-template';
import { QemuTemplate } from '../../../models/templates/qemu-template';
import { DockerService } from '../../../services/docker.service';
import { IosService } from '../../../services/ios.service';
import { IouService } from '../../../services/iou.service';
import { QemuService } from '../../../services/qemu.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-import-appliance',
  templateUrl: './import-appliance.component.html',
  styleUrls: ['./import-appliance.component.scss'],
})
export class ImportApplianceComponent implements OnInit {
  @Input('project') project: Project;
  @Input('controller') controller:Controller ;
  uploader: FileUploader;
  template;

  constructor(
    private toasterService: ToasterService,
    private dockerService: DockerService,
    private qemuService: QemuService,
    private iouService: IouService,
    private iosService: IosService
  ) {}

  ngOnInit() {
    this.uploader = new FileUploader({url: ''});
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error has occured');
    };

    this.uploader.onCompleteItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      if (this.template.template_type === 'qemu') {
        this.qemuService.addTemplate(this.controller, this.template).subscribe(() => this.onUploadComplete());
      } else if (this.template.template_type === 'iou') {
        this.iouService.addTemplate(this.controller, this.template).subscribe(() => this.onUploadComplete());
      } else if (this.template.template_type === 'dynamips') {
        this.iosService.addTemplate(this.controller, this.template).subscribe(() => this.onUploadComplete());
      } else if (this.template.template_type === 'docker') {
        this.dockerService.addTemplate(this.controller, this.template).subscribe(() => this.onUploadComplete());
      }
    };
  }

  private onUploadComplete() {
    this.toasterService.success('Appliance imported successfully');
    this.uploader.queue = [];
  }

  public uploadAppliance(event) {
    let file: File = event.target.files[0];
    let name: string = file.name;
    let fileReader: FileReader = new FileReader();

    let template;
    fileReader.onloadend = () => {
      let appliance = JSON.parse(fileReader.result as string);
      let emulator: string;

      if (appliance.qemu) {
        // option to select qemu image is missing
        template = new QemuTemplate();
        template.template_type = 'qemu';
        template.adapter_type = appliance.qemu.adapter_type;
        template.adapters = appliance.qemu.adapters;
        template.ram = appliance.qemu.ram;
        template.options = appliance.qemu.options;
        template.console_type = appliance.qemu.console_type;
      } else if (appliance.iou) {
        // option to choose IOU image is missing
        template = new IouTemplate();
        template.template_type = 'iou';
        template.console_type = appliance.iou.console_type;
        template.console_auto_start = appliance.iou.console_auto_start;
        template.ethernet_adapters = appliance.iou.ethernet_adapters;
        template.l1_keepalives = appliance.iou.l1_keepalives;
        template.use_default_iou_values = appliance.iou.use_default_iou_values;
        template.nvram = appliance.iou.nvram;
        template.ram = appliance.iou.ram;
        template.serial_adapters = appliance.iou.serial_adapters;
      } else if (appliance.dynamips) {
        // option to choose IOS image is missing
        template = new IosTemplate();
        template.template_type = 'dynamips';
        template.platform = appliance.dynamips.platform;
        template.ram = appliance.dynamips.ram;
        template.nvram = appliance.dynamips.nvram;
        template.startup_config = appliance.dynamips.startup_config;
        template.wic0 = appliance.dynamips.wic0;
        template.wic1 = appliance.dynamips.wic1;
        template.wic2 = appliance.dynamips.wic2;
        template.slot0 = appliance.dynamips.slot0;
        template.slot1 = appliance.dynamips.slot1;
        template.slot2 = appliance.dynamips.slot2;
        template.slot3 = appliance.dynamips.slot3;
        template.slot4 = appliance.dynamips.slot4;
        template.slot5 = appliance.dynamips.slot5;
        template.slot6 = appliance.dynamips.slot6;
        template.slot7 = appliance.dynamips.slot7;
      } else if (appliance.docker) {
        template = new DockerTemplate();
        template.template_type = 'docker';
        template.adapters = appliance.docker.adapters;
        template.console_type = appliance.docker.console_type;
        template.image = appliance.docker.image;
      } else {
        this.toasterService.error('Template type not supported');
        return;
      }
      template.name = appliance.name;
      template.category = appliance.category;
      template.builtin = false;
      template.default_name_format = '{name}-{0}';
      template.compute_id = 'vm';
      // qemu - VM
      // iou - VM + main controller
      // dynamips - vm + main controller
      // docker - vm

      if (template.category === 'guest') {
        template.symbol = `:/symbols/computer.svg`;
      } else {
        template.symbol = `:/symbols/${template.category}_guest.svg`;
      }
      this.template = template;

      const url = this.getUploadPath(this.controller, name);
      this.uploader.queue.forEach((elem) => (elem.url = url));
      const itemToUpload = this.uploader.queue[0];
      this.uploader.uploadItem(itemToUpload);
    };
    fileReader.readAsText(file);
  }

  private getUploadPath(controller:Controller , filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }
}
