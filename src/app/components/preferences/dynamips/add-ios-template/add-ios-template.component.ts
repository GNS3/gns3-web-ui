import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Compute } from '@models/compute';
import { IosImage } from '@models/images/ios-image';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { ComputeService } from '@services/compute.service';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-add-ios-template',
  templateUrl: './add-ios-template.component.html',
  styleUrls: ['./add-ios-template.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatRadioModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatStepperModule, FileUploadModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddIosTemplateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private iosConfigurationService = inject(IosConfigurationService);
  private computeService = inject(ComputeService);
  private uploadServiceService = inject(UploadServiceService);
  private snackBar = inject(MatSnackBar);

  readonly controller = signal<Controller | undefined>(undefined);
  readonly iosTemplate = signal<IosTemplate>(new IosTemplate());
  readonly isEtherSwitchRouter = signal<boolean>(false);

  readonly iosImageForm: UntypedFormGroup;
  readonly iosNameForm: UntypedFormGroup;
  readonly iosMemoryForm: UntypedFormGroup;
  readonly iosIdlePCForm: UntypedFormGroup;
  readonly selectedPlatform = signal<string>('');
  readonly iosImages = signal<IosImage[]>([]);
  readonly platforms = signal<string[]>([]);
  readonly platformsWithEtherSwitchRouterOption = signal<any>({});
  readonly chassis = signal<any>({});
  readonly defaultRam = signal<any>({});
  readonly networkAdaptersForTemplate = signal<string[]>([]);
  readonly wicsForTemplate = signal<string[]>([]);
  readonly adapterMatrix = signal<any>({});
  readonly wicMatrix = signal<any>({});

  readonly ciscoUrl = 'https://cfn.cloudapps.cisco.com/ITDIT/CFN/jsp/SearchBySoftware.jsp';
  readonly uploader = signal<FileUploader | undefined>(undefined);
  readonly isLocalComputerChosen = signal<boolean>(true);
  subscription: Subscription;

  constructor() {
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
    this.uploader.set(new FileUploader({url: ''}));
    this.uploader().onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader().onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error occured: ' + response);
    };
    this.uploader().onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.getImages();
      this.toasterService.success('Image uploaded');
    };
    this.uploader().onProgressItem = (progress: any) => {
      this.uploadServiceService.processBarCount(progress['progress'])
    };
   this.subscription = this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading()
      }

    })

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((ctrl: Controller ) => {
      this.controller.set(ctrl);

      this.getImages();

      this.templateMocksService.getIosTemplate().subscribe((iosTemplate: IosTemplate) => {
        this.iosTemplate.set(iosTemplate);
        this.platforms.set(this.iosConfigurationService.getAvailablePlatforms());
        this.platformsWithEtherSwitchRouterOption.set(this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption());
        this.chassis.set(this.iosConfigurationService.getChassis());
        this.defaultRam.set(this.iosConfigurationService.getDefaultRamSettings());
        this.adapterMatrix.set(this.iosConfigurationService.getAdapterMatrix());
        this.wicMatrix.set(this.iosConfigurationService.getWicMatrix());
      });
    });
  }

  fillDefaultSlots() {
    if (this.iosNameForm.get('platform').value) {
      const matrix = this.adapterMatrix();
      for (let i = 0; i <= 6; i++) {
        let adapters = matrix[this.iosNameForm.get('platform').value][this.iosNameForm.get('chassis').value || ''][i];
        if (adapters && (adapters.length === 1 || adapters[0].startsWith('C7200'))) {
          const currentAdapters = [...this.networkAdaptersForTemplate()];
          currentAdapters[i] = adapters[0];
          this.networkAdaptersForTemplate.set(currentAdapters);
        }
      }
    }
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen.set(true);
    }
  }

  getImages() {
    this.iosService.getImages(this.controller()).subscribe((images: IosImage[]) => {
      this.iosImages.set(images);
    });
  }

  addImage(event): void {
    let name = event.target.files[0].name.split('-')[0];
    this.iosNameForm.controls['templateName'].setValue(name);
    let fileName = event.target.files[0].name;

    const url = this.iosService.getImagePath(this.controller(), fileName);
    this.uploader().queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploader().queue[0];
    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller().authToken }])
    this.uploader().uploadItem(itemToUpload);
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
      const template = this.iosTemplate();
      template.template_id = uuid();
      template.image = this.iosImageForm.get('imageName').value;
      template.name = this.iosNameForm.get('templateName').value;
      template.platform = this.iosNameForm.get('platform').value;

      if (this.chassis()[this.iosNameForm.get('platform').value])
        template.chassis = this.iosNameForm.get('chassis').value;
      template.ram = this.iosMemoryForm.get('memory').value;

      if (this.isEtherSwitchRouter()) {
        template.symbol = 'multilayer_switch';
        template.category = 'switch';
      }

      if (this.networkAdaptersForTemplate().length > 0) this.completeAdaptersData(template);
      if (this.wicsForTemplate().length > 0) this.completeWicsData(template);
      template.compute_id = 'local';

      this.iosService.addTemplate(this.controller(), template).subscribe((iosTemplate: IosTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }

  completeAdaptersData(template: IosTemplate) {
    const matrix = this.adapterMatrix();
    for (let i = 0; i <= 6; i++) {
      if (matrix[template.platform][template.chassis || ''][i]) {
        if (this.networkAdaptersForTemplate()[i] === undefined)
          template[`slot${i}`] = ""
        else
          template[`slot${i}`] = this.networkAdaptersForTemplate()[i];
      }
    }
  }

  completeWicsData(template: IosTemplate) {
    const matrix = this.wicMatrix();
    for (let i = 0; i <= 3; i++) {
      if (matrix[template.platform][i]) {
        if (this.wicsForTemplate()[i] === undefined)
          template[`wic${i}`] = ""
        else
          template[`wic${i}`] = this.wicsForTemplate()[i];
      }
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller().id, 'preferences', 'dynamips', 'templates']);
  }

  onImageChosen() {
    let name: string = this.iosImageForm.get('imageName').value.split('-')[0];
    this.iosNameForm.controls['templateName'].setValue(name);

    if (name === 'c3620' || name === 'c3640' || name === 'c3660') {
      this.iosNameForm.controls['platform'].setValue('c3600');
      this.selectedPlatform.set('c3600');
    } else {
      this.iosNameForm.controls['platform'].setValue(name);
      this.selectedPlatform.set(name);
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
    this.iosMemoryForm.controls['memory'].setValue(this.defaultRam()[this.selectedPlatform()]);
    this.fillDefaultSlots();
  }

  onPlatformChosen() {
    const template = this.iosTemplate();
    template.chassis = '';
    this.iosTemplate.set({...template});
    this.networkAdaptersForTemplate.set([]);
    this.wicsForTemplate.set([]);
    if (!this.chassis()[this.iosNameForm.get('platform').value])
      this.fillDefaultSlots();
  }

  onChassisChosen() {
    this.networkAdaptersForTemplate.set([]);
    if (this.chassis()[this.iosNameForm.get('platform').value])
      this.fillDefaultSlots();
  }

  cancelUploading() {
    this.uploader().clearQueue();
    this.uploadServiceService.processBarCount(null)
    this.toasterService.warning('File upload cancelled');
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
