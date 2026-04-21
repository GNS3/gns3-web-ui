import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, model, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ProgressService } from '../../../../common/progress/progress.service';

@Component({
  selector: 'app-add-ios-template',
  templateUrl: './add-ios-template.component.html',
  styleUrls: ['./add-ios-template.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    FileUploadModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddIosTemplateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private iosConfigurationService = inject(IosConfigurationService);
  private computeService = inject(ComputeService);
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
  subscription: Subscription;

  // Step completion computed signals
  imageStepCompleted = computed(() => !!this.imageName());
  namePlatformStepCompleted = computed(() => !!this.templateName() && !!this.platform());
  memoryStepCompleted = computed(() => !!this.memory());

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
    this.controllerService.get(parseInt(controller_id, 10)).then((ctrl: Controller) => {
      this.controller.set(ctrl);

      this.getImages();

      this.templateMocksService.getIosTemplate().subscribe((iosTemplate: IosTemplate) => {
        this.iosTemplate.set(iosTemplate);
        this.platforms.set(this.iosConfigurationService.getAvailablePlatforms());
        this.platformsWithEtherSwitchRouterOption.set(
          this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption()
        );
        this.chassisOptions.set(this.iosConfigurationService.getChassis());
        this.defaultRam.set(this.iosConfigurationService.getDefaultRamSettings());
        this.adapterMatrix.set(this.iosConfigurationService.getAdapterMatrix());
        this.wicMatrix.set(this.iosConfigurationService.getWicMatrix());
      });
    });
  }

  fillDefaultSlots() {
    if (this.platform()) {
      const matrix = this.adapterMatrix();
      for (let i = 0; i <= 6; i++) {
        let adapters = matrix[this.platform()][this.chassis() || ''][i];
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
    if (this.imageName() && this.templateName() && this.platform() && this.memory()) {
      const template = this.iosTemplate();
      template.template_id = uuid();
      template.image = this.imageName();
      template.name = this.templateName();
      template.platform = this.platform();

      if (this.chassisOptions()[this.platform()]) template.chassis = this.chassis();
      template.ram = +this.memory();

      if (this.isEtherSwitchRouter()) {
        template.symbol = 'multilayer_switch';
        template.category = 'switch';
      }

      if (this.networkAdaptersForTemplate().length > 0) this.completeAdaptersData(template);
      if (this.wicsForTemplate().length > 0) this.completeWicsData(template);
      if (this.idlepc()) template.idlepc = this.idlepc();
      template.compute_id = 'local';

      this.iosService.addTemplate(this.controller(), template).subscribe({
        next: (iosTemplate: IosTemplate) => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add ios template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
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
    this.router.navigate(['/controller', this.controller().id, 'preferences', 'dynamips', 'templates']);
  }

  onImageChosen() {
    let name: string = this.imageName().split('-')[0];
    this.templateName.set(name);

    if (name === 'c3620' || name === 'c3640' || name === 'c3660') {
      this.platform.set('c3600');
    } else {
      this.platform.set(name);
    }

    if (name === 'c3620' || name === 'c3640' || name === 'c3660') this.chassis.set(name.substring(1));
    else if (name === 'c1700') {
      this.chassis.set('1760');
    } else if (name === 'c2600') {
      this.chassis.set('2651XM');
    } else {
      this.chassis.set('');
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
