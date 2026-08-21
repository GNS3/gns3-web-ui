import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  model,
  signal,
  inject,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { IosImage } from '@models/images/ios-image';
import { Controller } from '@models/controller';
import { NetmikoDeviceTypeSelectComponent } from '@components/netmiko-device-type-select/netmiko-device-type-select.component';
import { IosTemplate } from '@models/templates/ios-template';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';
import { ProgressService } from '../../../../common/progress/progress.service';
import { TemplateInfoFieldsComponent } from '../../common/template-info-fields/template-info-fields.component';

@Component({
  selector: 'app-add-ios-template',
  templateUrl: './add-ios-template.component.html',
  styleUrls: ['./add-ios-template.component.scss', '../../preferences.component.scss'],
  imports: [
    NetmikoDeviceTypeSelectComponent,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    FileUploadModule,
    TemplateInfoFieldsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddIosTemplateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private validationService = inject(ValidationService);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private iosConfigurationService = inject(IosConfigurationService);
  private uploadServiceService = inject(UploadServiceService);
  private progressService = inject(ProgressService);
  private snackBar = inject(MatSnackBar);
  private cd = inject(ChangeDetectorRef);

  readonly controller = signal<Controller | undefined>(undefined);
  readonly iosTemplate = signal<IosTemplate>(new IosTemplate());
  readonly isEtherSwitchRouter = signal<boolean>(false);

  // Form field signals
  imageName = model('');
  templateName = model('');
  platform = model('');
  chassis = model('');
  memory = model('');
  idlepc = model('');
  netmikoDeviceType = model('');
  usage = model('');
  symbol = model('router');

  readonly iosImages = signal<IosImage[]>([]);
  readonly platforms = signal<string[]>([]);
  readonly platformsWithEtherSwitchRouterOption = signal<any>({});
  readonly chassisOptions = signal<any>({});
  readonly defaultRam = signal<any>({});
  readonly networkAdaptersForTemplate = signal<string[]>([]);
  readonly wicsForTemplate = signal<string[]>([]);
  readonly adapterMatrix = signal<any>({});
  readonly wicMatrix = signal<any>({});

  readonly ciscoUrl = 'https://cfn.cloudapps.cisco.com/ITDIT/CFN/jsp/SearchBySoftware.jsp';
  readonly uploader = signal<FileUploader | undefined>(undefined);
  readonly isLocalComputerChosen = signal<boolean>(true);
  readonly selectedStepIndex = signal(0);
  subscription: Subscription;

  // Step completion computed signals
  imageStepCompleted = computed(() => !!this.imageName());
  namePlatformStepCompleted = computed(() => !!this.templateName() && !!this.platform());
  memoryStepCompleted = computed(() => !!this.memory());

  canAdvance(): boolean {
    switch (this.selectedStepIndex()) {
      case 0:
        return this.isLocalComputerChosen();
      case 1:
        return this.imageStepCompleted();
      case 2:
        return this.namePlatformStepCompleted();
      case 3:
        return this.memoryStepCompleted();
      default:
        return true;
    }
  }

  canCreateTemplate(): boolean {
    return (
      !!this.controller() && this.imageStepCompleted() && this.namePlatformStepCompleted() && this.memoryStepCompleted()
    );
  }

  ngOnInit() {
    this.uploader.set(new FileUploader({ url: '' }));
    this.uploader().onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader().onErrorItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
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
      this.uploadServiceService.processBarCount(progress['progress']);
    };
    this.subscription = this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading();
      }
    });

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (ctrl: Controller) => {
        this.controller.set(ctrl);

        this.getImages();

        this.templateMocksService.getIosTemplate().subscribe({
          next: (iosTemplate: IosTemplate) => {
            this.iosTemplate.set(iosTemplate);
            this.platforms.set(this.iosConfigurationService.getAvailablePlatforms());
            this.platformsWithEtherSwitchRouterOption.set(
              this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption()
            );
            this.chassisOptions.set(this.iosConfigurationService.getChassis());
            this.defaultRam.set(this.iosConfigurationService.getDefaultRamSettings());
            this.adapterMatrix.set(this.iosConfigurationService.getAdapterMatrix());
            this.wicMatrix.set(this.iosConfigurationService.getWicMatrix());
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load template';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  fillDefaultSlots() {
    if (!this.platform()) return;

    const matrix = this.adapterMatrix();
    const platformAdapters = matrix[this.platform()];
    if (!platformAdapters) return;

    // For platforms with chassis options (c1700, c2600, c3600), chassis must be set
    const hasChassisOptions = this.chassisOptions()[this.platform()];
    if (hasChassisOptions && !this.chassis()) return;

    // For platforms without chassis (c2691, c3725, c3745, c7200), use empty string
    const chassisKey = hasChassisOptions ? this.chassis() : '';
    const chassisAdapters = platformAdapters[chassisKey];
    if (!chassisAdapters) return;

    for (let i = 0; i <= 6; i++) {
      let adapters = chassisAdapters[i];
      if (adapters && (adapters.length === 1 || adapters[0].startsWith('C7200'))) {
        const currentAdapters = [...this.networkAdaptersForTemplate()];
        currentAdapters[i] = adapters[0];
        this.networkAdaptersForTemplate.set(currentAdapters);
      }
    }
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen.set(true);
    }
  }

  getImages() {
    this.iosService.getImages(this.controller()).subscribe({
      next: (images: IosImage[]) => {
        this.iosImages.set(images);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  addImage(event): void {
    let name = event.target.files[0].name.split('-')[0];
    this.templateName.set(name);
    let fileName = event.target.files[0].name;

    const url = this.iosService.getImagePath(this.controller(), fileName);
    this.uploader().queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploader().queue[0];
    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true;
    (itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller().authToken }];
    this.uploader().uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data: { upload_file_type: 'Image' },
    });
  }

  addTemplate() {
    if (this.canCreateTemplate()) {
      const netmikoValidation = this.validationService.validateNetmikoDeviceType(this.netmikoDeviceType());
      if (!netmikoValidation.isValid) {
        this.toasterService.error(netmikoValidation.errorMessage);
        return;
      }

      const template = this.iosTemplate();
      template.template_id = uuid();
      template.image = this.imageName();
      template.name = this.templateName();
      template.platform = this.platform();
      template.usage = this.usage();
      template.symbol = this.symbol();

      if (this.chassisOptions()[this.platform()]) template.chassis = this.chassis();
      template.ram = +this.memory();

      if (this.isEtherSwitchRouter()) {
        template.symbol = 'multilayer_switch';
        template.category = 'switch';
      }

      if (this.networkAdaptersForTemplate().length > 0) this.completeAdaptersData(template);
      if (this.wicsForTemplate().length > 0) this.completeWicsData(template);
      if (this.idlepc()) template.idlepc = this.idlepc();
      template.netmiko_device_type = this.netmikoDeviceType().trim() || null;
      template.compute_id = 'local';

      this.iosService.addTemplate(this.controller(), template).subscribe({
        next: () => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add ios template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }

  completeAdaptersData(template: IosTemplate) {
    const matrix = this.adapterMatrix();
    for (let i = 0; i <= 6; i++) {
      if (matrix[template.platform][template.chassis || ''][i]) {
        if (this.networkAdaptersForTemplate()[i] === undefined) template[`slot${i}`] = '';
        else template[`slot${i}`] = this.networkAdaptersForTemplate()[i];
      }
    }
  }

  completeWicsData(template: IosTemplate) {
    const matrix = this.wicMatrix();
    for (let i = 0; i <= 3; i++) {
      if (matrix[template.platform][i]) {
        if (this.wicsForTemplate()[i] === undefined) template[`wic${i}`] = '';
        else template[`wic${i}`] = this.wicsForTemplate()[i];
      }
    }
  }

  goBack() {
    const controllerId = this.controller()?.id ?? parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);
    this.router.navigate(['/controller', controllerId, 'preferences']);
  }

  onImageChosen() {
    let name: string = this.imageName().split('-')[0];
    this.templateName.set(name);

    // Extract chassis from filename (e.g., '1710' from 'c1710')
    let chassisFromName = name.substring(1);

    // 1. Check if it's a complete valid platform name
    const validPlatforms = ['c1700', 'c2600', 'c2691', 'c3725', 'c3745', 'c3600', 'c7200'];
    if (validPlatforms.includes(name)) {
      this.platform.set(name);
      // Set default chassis for platforms that require it
      if (name === 'c1700') {
        this.chassis.set('1760');
      } else if (name === 'c2600') {
        this.chassis.set('2651XM');
      } else {
        this.chassis.set('');
      }
    }
    // 2. Check for c3600 chassis variants
    else if (name.startsWith('c36')) {
      this.platform.set('c3600');
      const validChassis = ['3620', '3640', '3660'];
      if (validChassis.includes(chassisFromName)) {
        this.chassis.set(chassisFromName);
      } else {
        this.chassis.set('');
        this.toasterService.warning(
          `Invalid chassis '${chassisFromName}' for platform c3600. Please select a valid chassis: ${validChassis.join(
            ', '
          )}`
        );
      }
    }
    // 3. Check for c1700 chassis variants
    else if (name.startsWith('c17')) {
      this.platform.set('c1700');
      const validChassis = ['1720', '1721', '1750', '1751', '1760'];
      if (validChassis.includes(chassisFromName)) {
        this.chassis.set(chassisFromName);
      } else {
        this.chassis.set('');
        this.toasterService.warning(
          `Invalid chassis '${chassisFromName}' for platform c1700. Please select a valid chassis: ${validChassis.join(
            ', '
          )}`
        );
      }
    }
    // 4. Check for c2600 chassis variants (but not c2691)
    else if (name.startsWith('c26')) {
      this.platform.set('c2600');
      const validChassis = ['2610', '2611', '2620', '2621', '2610XM', '2611XM', '2620XM', '2621XM', '2650XM', '2651XM'];
      if (validChassis.includes(chassisFromName)) {
        this.chassis.set(chassisFromName);
      } else {
        this.chassis.set('');
        this.toasterService.warning(
          `Invalid chassis '${chassisFromName}' for platform c2600. Please select a valid chassis.`
        );
      }
    }
    // 5. Unknown platform, warn user
    else {
      this.platform.set(name);
      this.chassis.set('');
      this.toasterService.warning(
        `Unknown platform '${name}'. Supported platforms are: c1700, c2600, c2691, c3600, c3725, c3745, c7200. Please verify the platform manually.`
      );
    }
    this.memory.set(String(this.defaultRam()[this.platform()]));
    this.fillDefaultSlots();
  }

  onPlatformChosen() {
    const template = this.iosTemplate();
    template.chassis = '';
    this.iosTemplate.set({ ...template });
    this.networkAdaptersForTemplate.set([]);
    this.wicsForTemplate.set([]);
    if (!this.chassisOptions()[this.platform()]) this.fillDefaultSlots();
  }

  onChassisChosen() {
    this.networkAdaptersForTemplate.set([]);
    if (this.chassisOptions()[this.platform()]) this.fillDefaultSlots();
  }

  cancelUploading() {
    this.uploader().clearQueue();
    this.uploadServiceService.processBarCount(null);
    this.toasterService.warning('File upload cancelled');
  }

  onAdapterChange(index: number, value: string): void {
    this.networkAdaptersForTemplate.update((adapters) => {
      const newAdapters = [...adapters];
      newAdapters[index] = value;
      return newAdapters;
    });
  }

  onWicChange(index: number, value: string): void {
    this.wicsForTemplate.update((wics) => {
      const newWics = [...wics];
      newWics[index] = value;
      return newWics;
    });
  }

  findIdlePC() {
    const data = {
      image: this.imageName(),
      platform: this.platform(),
      ram: +this.memory(),
    };
    this.progressService.activate();
    this.iosService.findIdlePC(this.controller(), data).subscribe(
      (result: any) => {
        this.progressService.deactivate();
        if (result.idlepc !== null) {
          this.idlepc.set(result.idlepc);
          this.toasterService.success(`Idle-PC value found: ${result.idlepc}`);
        }
      },
      (error) => {
        this.progressService.deactivate();
        this.toasterService.error(`Error while finding an idle-PC value`);
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
