import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import{ Controller } from '../../../../models/controller';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';
import { QemuService } from '../../../../services/qemu.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';

@Component({
  selector: 'app-qemu-virtual-machine-template-details',
  templateUrl: './qemu-vm-template-details.component.html',
  styleUrls: ['./qemu-vm-template-details.component.scss', '../../preferences.component.scss'],
})
export class QemuVmTemplateDetailsComponent implements OnInit {
  controller:Controller ;
  qemuTemplate: QemuTemplate;
  isSymbolSelectionOpened: boolean = false;
  consoleTypes: string[] = [];
  diskInterfaces: string[] = [];
  networkTypes = [];
  bootPriorities = [];
  onCloseOptions = [];
  categories = [];
  priorities: string[] = [];
  activateCpuThrottling: boolean = true;
  isConfiguratorOpened: boolean = false;
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  generalSettingsForm: FormGroup;
  selectPlatform: string[] = [];
  selectedPlatform: string;


  @ViewChild('customAdaptersConfigurator')
  customAdaptersConfigurator: CustomAdaptersComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private qemuService: QemuService,
    private toasterService: ToasterService,
    private configurationService: QemuConfigurationService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      defaultName: new FormControl('', Validators.required),
      symbol: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.getConfiguration();
      this.qemuService.getTemplate(this.controller, template_id).subscribe((qemuTemplate: QemuTemplate) => {
        this.qemuTemplate = qemuTemplate;
        this.fillCustomAdapters();
      });
    });

    this.selectPlatform = this.configurationService.getPlatform();
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.diskInterfaces = this.configurationService.getDiskInterfaces();
    this.networkTypes = this.configurationService.getNetworkTypes();
    this.bootPriorities = this.configurationService.getBootPriorities();
    this.onCloseOptions = this.configurationService.getOnCloseOptions();
    this.categories = this.configurationService.getCategories();
    this.priorities = this.configurationService.getPriorities();
  }

  uploadCdromImageFile(event) {
    this.qemuTemplate.cdrom_image = event.target.files[0].name;
  }

  uploadInitrdFile(event) {
    this.qemuTemplate.initrd = event.target.files[0].name;
  }

  uploadKernelImageFile(event) {
    this.qemuTemplate.kernel_image = event.target.files[0].name;
  }

  uploadBiosFile(event) {
    this.qemuTemplate.bios_image = event.target.files[0].name;
  }

  setCustomAdaptersConfiguratorState(state: boolean) {
    this.isConfiguratorOpened = state;

    if (state) {
      this.fillCustomAdapters();
      this.customAdaptersConfigurator.numberOfAdapters = this.qemuTemplate.adapters;
      this.customAdaptersConfigurator.adapters = [];
      this.qemuTemplate.custom_adapters.forEach((adapter: CustomAdapter,i) => {
        this.customAdaptersConfigurator.adapters.push({
          adapter_number: adapter.adapter_number,
          adapter_type: adapter.adapter_type,
          mac_address:null,
          port_name:this.qemuTemplate.port_name_format +'/'+ `${i}`
        });
      });
    }
  }

  saveCustomAdapters(adapters: CustomAdapter[]) {
    this.setCustomAdaptersConfiguratorState(false);
    this.qemuTemplate.custom_adapters = adapters;
  }

  fillCustomAdapters() {

    let copyOfAdapters = this.qemuTemplate.custom_adapters ? this.qemuTemplate.custom_adapters : [];
    this.qemuTemplate.custom_adapters = [];
    for (let i = 0; i < this.qemuTemplate.adapters; i++) {
      if (copyOfAdapters[i]) {
        this.qemuTemplate.custom_adapters.push(copyOfAdapters[i]);
      } else {
        this.qemuTemplate.custom_adapters.push({
          adapter_number: i,
          adapter_type: this.qemuTemplate.adapter_type,
          mac_address:null,
          port_name:this.qemuTemplate.port_name_format.replace(/[0-9]/g,`${i}`)
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'qemu', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      if (!this.activateCpuThrottling) {
        this.qemuTemplate.cpu_throttling = 0;
      }
      this.fillCustomAdapters();

      this.qemuService.saveTemplate(this.controller, this.qemuTemplate).subscribe((savedTemplate: QemuTemplate) => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.qemuTemplate.symbol = chosenSymbol;
  }
}
