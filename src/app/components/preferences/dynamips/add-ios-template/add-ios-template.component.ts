import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import { IosImage } from '../../../../models/images/ios-image';
import { Controller } from '../../../../models/controller';
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

  iosImageForm: UntypedFormGroup;
  iosNameForm: UntypedFormGroup;
  iosMemoryForm: UntypedFormGroup;
  iosIdlePCForm: UntypedFormGroup;
  selectedPlatform: string;
  iosImages: IosImage[] = [];
  platforms: string[] = [];
  platformsWithEtherSwitchRouterOption = {};
  platformsWithChassis = {};
  chassis = {};
  defaultRam = {};
  defaultNvram = {};
  networkAdaptersForTemplate: string[] = [];
  wicsForTemplate: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};

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
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private templateMocksService: TemplateMocksService,
    private iosConfigurationService: IosConfigurationService,
    private computeService: ComputeService,
    private uploadServiceService: UploadServiceService,
    private snackBar : MatSnackBar,
  ) {
    this.iosTemplate = new IosTemplate();

    this.iosImageForm = this.formBuilder.group({
      imageName: new UntypedFormControl(null, [Validators.required]),
    });

    this.iosNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, [Validators.required]),
      platform: new UntypedFormControl(null, [Validators.required]),
      chassis: new UntypedFormControl(null, [Validators.required]),
    });

    this.iosMemoryForm = this.formBuilder.group({
      memory: new UntypedFormControl(null, [Validators.required]),
    });

    this.iosIdlePCForm = this.formBuilder.group({
      idlepc: new UntypedFormControl(null, [Validators.pattern(this.iosConfigurationService.getIdlepcRegex())]),
    });
  }

  ngOnInit() {
    this.uploader = new FileUploader({url: ''});
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
        this.platforms = this.iosConfigurationService.getAvailablePlatforms();
        this.platformsWithEtherSwitchRouterOption = this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption();
        this.platformsWithChassis = this.iosConfigurationService.getPlatformsWithChassis();
        this.chassis = this.iosConfigurationService.getChassis();
        this.defaultRam = this.iosConfigurationService.getDefaultRamSettings();
        this.adapterMatrix = this.iosConfigurationService.getAdapterMatrix();
        this.wicMatrix = this.iosConfigurationService.getWicMatrix();
      });
    });
  }

  fillDefaultSlots() {

    console.log("Fill default slots");
    if (this.iosNameForm.get('platform').value) {
      for (let i = 0; i <= 6; i++) {
        let adapters = this.adapterMatrix[this.iosNameForm.get('platform').value][this.iosNameForm.get('chassis').value || ''][i];
        if (adapters && (adapters.length === 1 || adapters[0].startsWith('C7200'))) {
          console.log("Set default adapter for slot" + i + " to " + adapters[0]);
          this.networkAdaptersForTemplate[i] = adapters[0];
        }
      }
    }
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
      !this.iosIdlePCForm.invalid &&
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
      if (this.wicsForTemplate.length > 0) this.completeWicsData();
      this.iosTemplate.compute_id = 'local';

      this.iosService.addTemplate(this.controller, this.iosTemplate).subscribe((template: IosTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }

  completeAdaptersData() {
    for (let i = 0; i <= 6; i++) {
      if (this.adapterMatrix[this.iosTemplate.platform][this.iosTemplate.chassis || ''][i]) {
        if (this.networkAdaptersForTemplate[i] === undefined)
          this.iosTemplate[`slot${i}`] = ""
        else
          this.iosTemplate[`slot${i}`] = this.networkAdaptersForTemplate[i];
      }
    }
  }

  completeWicsData() {
    for (let i = 0; i <= 3; i++) {
      if (this.wicMatrix[this.iosTemplate.platform][i]) {
        if (this.wicsForTemplate[i] === undefined)
          this.iosTemplate[`wic${i}`] = ""
        else
          this.iosTemplate[`wic${i}`] = this.wicsForTemplate[i];
      }
    }
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

    if (name === 'c3620' || name === 'c3640' || name === 'c3660')
      this.iosNameForm.controls['chassis'].setValue(name.substring(1));
    else if (name === 'c1700') {
      this.iosNameForm.controls['chassis'].setValue('1760');
    } else if (name === 'c2600') {
      this.iosNameForm.controls['chassis'].setValue('2651XM');
    } else {
      this.iosNameForm.controls['chassis'].setValue('');
    }
    this.iosMemoryForm.controls['memory'].setValue(this.defaultRam[this.selectedPlatform]);
    this.fillDefaultSlots();
  }

  onPlatformChosen() {
    this.iosTemplate.chassis = '';
    this.networkAdaptersForTemplate = [];
    this.wicsForTemplate = [];
    if (!this.chassis[this.iosNameForm.get('platform').value])
      this.fillDefaultSlots();
  }

  onChassisChosen() {
    this.networkAdaptersForTemplate = [];
    if (this.chassis[this.iosNameForm.get('platform').value])
      this.fillDefaultSlots();
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
