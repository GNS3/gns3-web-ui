import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import { IosImage } from '../../../../models/images/ios-image';
import{ Controller } from '../../../../models/controller';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { ComputeService } from '../../../../services/compute.service';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';
import { IosService } from '../../../../services/ios.service';
import { ControllerService } from '../../../../services/controller.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-add-ios-template',
  templateUrl: './add-ios-template.component.html',
  styleUrls: ['./add-ios-template.component.scss', '../../preferences.component.scss'],
})
export class AddIosTemplateComponent implements OnInit, OnDestroy {
  controller:Controller ;
  iosTemplate: IosTemplate;
  isEtherSwitchRouter: boolean = false;

  iosImageForm: FormGroup;
  iosNameForm: FormGroup;
  iosMemoryForm: FormGroup;
  selectedPlatform: string;

  networkAdaptersForTemplate: string[] = [];
  networkModulesForTemplate: string[] = [];

  iosImages: IosImage[] = [];
  platforms: string[] = [];
  platformsWithEtherSwitchRouterOption = {};
  platformsWithChassis = {};
  chassis = {};
  defaultRam = {};
  defaultNvram = {};
  networkAdapters = {};
  networkAdaptersForPlatform = {};
  networkModules = {};

  ciscoUrl: string = 'https://cfn.cloudapps.cisco.com/ITDIT/CFN/jsp/SearchBySoftware.jsp';
  uploader: FileUploader;
  isLocalComputerChosen: boolean = true;
  uploadProgress:number = 0;
  subscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iosService: IosService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private router: Router,
    private templateMocksService: TemplateMocksService,
    private iosConfigurationService: IosConfigurationService,
    private computeService: ComputeService,
    private uploadServiceService: UploadServiceService,
    private snackBar : MatSnackBar,
  ) {
    this.iosTemplate = new IosTemplate();

    this.iosImageForm = this.formBuilder.group({
      imageName: new FormControl(null, [Validators.required]),
    });

    this.iosNameForm = this.formBuilder.group({
      templateName: new FormControl(null, [Validators.required]),
      platform: new FormControl(null, [Validators.required]),
      chassis: new FormControl(null, [Validators.required]),
    });

    this.iosMemoryForm = this.formBuilder.group({
      memory: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    this.uploader = new FileUploader({});
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error occured: ' + response);
    };
    this.uploader.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.getImages();
      this.toasterService.success('Image uploaded');
    };
    this.uploader.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress)
    };
   this.subscription = this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading()
      }

    })

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.getImages();

      this.templateMocksService.getIosTemplate().subscribe((iosTemplate: IosTemplate) => {
        this.iosTemplate = iosTemplate;

        this.networkModules = this.iosConfigurationService.getNetworkModules();
        this.networkAdaptersForPlatform = this.iosConfigurationService.getNetworkAdaptersForPlatform();
        this.networkAdapters = this.iosConfigurationService.getNetworkAdapters();
        this.platforms = this.iosConfigurationService.getAvailablePlatforms();
        this.platformsWithEtherSwitchRouterOption = this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption();
        this.platformsWithChassis = this.iosConfigurationService.getPlatformsWithChassis();
        this.chassis = this.iosConfigurationService.getChassis();
        this.defaultRam = this.iosConfigurationService.getDefaultRamSettings();
      });
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  getImages() {
    this.iosService.getImages(this.controller).subscribe((images: IosImage[]) => {
      this.iosImages = images;
    });
  }

  addImage(event): void {
    let name = event.target.files[0].name.split('-')[0];
    this.iosNameForm.controls['templateName'].setValue(name);
    let fileName = event.target.files[0].name;

    const url = this.iosService.getImagePath(this.controller, fileName);
    this.uploader.queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploader.queue[0];
    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }])
    this.uploader.uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data:{upload_file_type:'Image'}
    });
  }

  addTemplate() {
    if (
      !this.iosImageForm.invalid &&
      !this.iosMemoryForm.invalid &&
      this.iosNameForm.get('templateName').value &&
      this.iosNameForm.get('platform').value
    ) {
      this.iosTemplate.template_id = uuid();
      this.iosTemplate.image = this.iosImageForm.get('imageName').value;
      this.iosTemplate.name = this.iosNameForm.get('templateName').value;
      this.iosTemplate.platform = this.iosNameForm.get('platform').value;

      if (this.chassis[this.iosNameForm.get('platform').value])
        this.iosTemplate.chassis = this.iosNameForm.get('chassis').value;
      this.iosTemplate.ram = this.iosMemoryForm.get('memory').value;

      if (this.isEtherSwitchRouter) {
        this.iosTemplate.symbol = 'multilayer_switch';
        this.iosTemplate.category = 'switch';
      }

      if (this.networkAdaptersForTemplate.length > 0) this.completeAdaptersData();
      if (this.networkModulesForTemplate.length > 0) this.completeModulesData();
      this.iosTemplate.compute_id = 'local';

      this.iosService.addTemplate(this.controller, this.iosTemplate).subscribe((template: IosTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }

  completeAdaptersData() {
    if (this.chassis[this.iosTemplate.platform]) {
      if (Object.keys(this.networkAdapters[this.iosTemplate.chassis])) {
        for (let i = 0; i < Object.keys(this.networkAdapters[this.iosTemplate.chassis]).length; i++) {
          if (!this.networkAdaptersForTemplate[i]) this.networkAdaptersForTemplate[i] = '';
        }
      }
    } else {
      if (this.networkAdaptersForPlatform[this.iosNameForm.get('platform').value]) {
        for (
          let i = 0;
          i < Object.keys(this.networkAdaptersForPlatform[this.iosNameForm.get('platform').value]).length;
          i++
        ) {
          if (!this.networkAdaptersForTemplate[i]) this.networkAdaptersForTemplate[i] = '';
        }
      }
    }

    if (this.networkAdaptersForTemplate[0]) this.iosTemplate.slot0 = this.networkAdaptersForTemplate[0];
    if (this.networkAdaptersForTemplate[1]) this.iosTemplate.slot1 = this.networkAdaptersForTemplate[1];
    if (this.networkAdaptersForTemplate[2]) this.iosTemplate.slot2 = this.networkAdaptersForTemplate[2];
    if (this.networkAdaptersForTemplate[3]) this.iosTemplate.slot3 = this.networkAdaptersForTemplate[3];
    if (this.networkAdaptersForTemplate[4]) this.iosTemplate.slot4 = this.networkAdaptersForTemplate[4];
    if (this.networkAdaptersForTemplate[5]) this.iosTemplate.slot5 = this.networkAdaptersForTemplate[5];
    if (this.networkAdaptersForTemplate[6]) this.iosTemplate.slot6 = this.networkAdaptersForTemplate[6];
    if (this.networkAdaptersForTemplate[7]) this.iosTemplate.slot7 = this.networkAdaptersForTemplate[7];
  }

  completeModulesData() {
    if (Object.keys(this.networkModules[this.iosTemplate.platform])) {
      for (let i = 0; i < Object.keys(this.networkModules[this.iosTemplate.platform]).length; i++) {
        if (!this.networkModulesForTemplate[i]) this.networkModulesForTemplate[i] = '';
      }
    }

    if (this.networkModulesForTemplate[0]) this.iosTemplate.wic0 = this.networkModulesForTemplate[0];
    if (this.networkModulesForTemplate[1]) this.iosTemplate.wic1 = this.networkModulesForTemplate[1];
    if (this.networkModulesForTemplate[2]) this.iosTemplate.wic2 = this.networkModulesForTemplate[2];
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'dynamips', 'templates']);
  }

  onImageChosen() {
    let name: string = this.iosImageForm.get('imageName').value.split('-')[0];
    this.iosNameForm.controls['templateName'].setValue(name);

    if (name === 'c3620' || name === 'c3640' || name === 'c3660') {
      this.iosNameForm.controls['platform'].setValue('c3600');
      this.selectedPlatform = 'c3600';
    } else {
      this.iosNameForm.controls['platform'].setValue(name);
      this.selectedPlatform = name;
    }

    if (name === 'c1700') {
      this.iosNameForm.controls['chassis'].setValue('1720');
    } else if (name === 'c2600') {
      this.iosNameForm.controls['chassis'].setValue('2610');
    } else {
      this.iosNameForm.controls['chassis'].setValue('');
    }

    this.iosMemoryForm.controls['memory'].setValue(this.defaultRam[name]);
  }

  onPlatformChosen() {
    this.iosTemplate.chassis = '';
    this.networkAdaptersForTemplate = [];
    this.networkModulesForTemplate = [];
  }

  onChassisChosen() {
    this.networkAdaptersForTemplate = [];
  }

  cancelUploading() {
    this.uploader.clearQueue();
    this.uploadServiceService.processBarCount(null)
    this.toasterService.warning('File upload cancelled');
    // this.uploadServiceService.cancelFileUploading(false)
    // window.location.reload()

  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
