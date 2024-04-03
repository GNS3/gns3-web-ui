import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import * as SparkMD5 from 'spark-md5';
import { v4 as uuid } from 'uuid';
import { ProgressService } from '../../../common/progress/progress.service';
import { InformationDialogComponent } from '../../../components/dialogs/information-dialog.component';
import { Appliance, Image, Version } from '../../../models/appliance';
import { Project } from '../../../models/project';
import { QemuBinary } from '../../../models/qemu/qemu-binary';
import{ Controller } from '../../../models/controller';
import { Template } from '../../../models/template';
import { DockerTemplate } from '../../../models/templates/docker-template';
import { IosTemplate } from '../../../models/templates/ios-template';
import { IouTemplate } from '../../../models/templates/iou-template';
import { QemuTemplate } from '../../../models/templates/qemu-template';
import { ApplianceService } from '../../../services/appliances.service';
import { ComputeService } from '../../../services/compute.service';
import { DockerService } from '../../../services/docker.service';
import { IosService } from '../../../services/ios.service';
import { IouService } from '../../../services/iou.service';
import { QemuService } from '../../../services/qemu.service';
import { TemplateService } from '../../../services/template.service';
import { ToasterService } from '../../../services/toaster.service';
import { ApplianceInfoDialogComponent } from './appliance-info-dialog/appliance-info-dialog.component';
import { TemplateNameDialogComponent } from './template-name-dialog/template-name-dialog.component';
import { UploadServiceService } from '../../../common/uploading-processbar/upload-service.service';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-new-template-dialog',
  templateUrl: './new-template-dialog.component.html',
  styleUrls: ['./new-template-dialog.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class NewTemplateDialogComponent implements OnInit {
  @Input() controller:Controller ;
  @Input() project: Project;

  uploader: FileUploader;
  uploaderImage: FileUploader;

  public action: string = 'install';
  public actionTitle: string = 'Install appliance from controller';
  public secondActionTitle: string = 'Appliance settings';

  public searchText: string = '';
  public allAppliances: Appliance[] = [];
  public appliances: Appliance[] = [];
  public applianceToInstall: Appliance;
  public selectedImages: any[];
  public isLinuxPlatform = false;
  private isLocalComputerChosen = false;


  public categories: string[] = ['all categories', 'router', 'multilayer_switch', 'guest', 'firewall'];
  public category: string = 'all categories';
  public displayedColumns: string[] = ['name', 'emulator', 'vendor', 'actions'];

  public dataSource: MatTableDataSource<Appliance>;

  private qemuImages: Image[] = [];
  private iosImages: Image[] = [];
  private iouImages: Image[] = [];

  private templates: Template[] = [];
  uploadProgress: number = 0;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  constructor(
    public dialogRef: MatDialogRef<NewTemplateDialogComponent>,
    private applianceService: ApplianceService,
    private changeDetector: ChangeDetectorRef,
    private toasterService: ToasterService,
    private qemuService: QemuService,
    private dockerService: DockerService,
    private iosService: IosService,
    private iouService: IouService,
    private templateService: TemplateService,
    public dialog: MatDialog,
    private computeService: ComputeService,
    private changeDetectorRef: ChangeDetectorRef,
    private progressService: ProgressService,
    public snackBar: MatSnackBar,
    private uploadServiceService: UploadServiceService
  ) { }

  ngOnInit() {
    this.applianceService.getAppliances(this.controller).subscribe((appliances) => {
      this.appliances = appliances;
      this.appliances.forEach((appliance) => {
        if (appliance.docker) appliance.emulator = 'Docker';
        if (appliance.dynamips) appliance.emulator = 'Dynamips';
        if (appliance.iou) appliance.emulator = 'Iou';
        if (appliance.qemu) appliance.emulator = 'Qemu';
      });
      this.allAppliances = appliances;
      this.dataSource = new MatTableDataSource(this.allAppliances);
      this.dataSource.paginator = this.paginator;
    });

    this.templateService.list(this.controller).subscribe((templates) => {
      this.templates = templates;
    });

    this.computeService.getComputes(this.controller).subscribe((computes) => {
      computes.forEach((compute) => {
        if (compute.capabilities.platform === 'linux') this.isLinuxPlatform = true;
      });
    });

    this.qemuService.getImages(this.controller).subscribe((qemuImages) => {
      this.qemuImages = qemuImages;
    });

    this.iosService.getImages(this.controller).subscribe((iosImages) => {
      this.iosImages = iosImages;
    });

    this.iouService.getImages(this.controller).subscribe((iouImages) => {
      this.iouImages = iouImages;
    });

    this.applianceService.getAppliances(this.controller).subscribe((appliances) => {
      this.appliances = appliances;
      this.appliances.forEach((appliance) => {
        if (appliance.docker) appliance.emulator = 'Docker';
        if (appliance.dynamips) appliance.emulator = 'Dynamips';
        if (appliance.iou) appliance.emulator = 'Iou';
        if (appliance.qemu) appliance.emulator = 'Qemu';
      });
      this.allAppliances = appliances;
      this.dataSource = new MatTableDataSource(this.allAppliances);
      this.dataSource.paginator = this.paginator;
    });

    this.uploader = new FileUploader({url: ''});
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error has occured');
    };

    this.uploader.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.success('Appliance imported succesfully');
      this.getAppliance(item.url);
    };

    this.uploaderImage = new FileUploader({url: ''});
    this.uploaderImage.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploaderImage.onErrorItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.error('An error has occured because image already exists');
      this.progressService.deactivate();
      this.uploaderImage.clearQueue();
    };

    this.uploaderImage.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.success('Image imported succesfully');
      this.refreshImages();
      this.progressService.deactivate();
      this.uploaderImage.clearQueue();
    };

    this.uploaderImage.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress)
    };

    this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading()
      }

    })

  }

  updateAppliances() {
    this.progressService.activate();
    this.applianceService.updateAppliances(this.controller).subscribe(
      (appliances) => {
        this.appliances = appliances;
        this.progressService.deactivate();
        this.toasterService.success('Appliances are up-to-date.');
      },
      (error) => {
        this.progressService.deactivate();
        this.toasterService.error('Appliances were not updated correctly.');
      }
    );
  }

  refreshImages() {
    this.qemuService.getImages(this.controller).subscribe((qemuImages) => {
      this.qemuImages = qemuImages;
    });

    this.iosService.getImages(this.controller).subscribe((iosImages) => {
      this.iosImages = iosImages;
    });

    this.iouService.getImages(this.controller).subscribe((iouImages) => {
      this.iouImages = iouImages;
    });

  }

  getAppliance(url: string) {
    let str = url.split(`/${environment.current_version}`);
    let appliancePath = str[str.length - 1];
    this.applianceService.getAppliance(this.controller, appliancePath).subscribe((appliance: Appliance) => {
      this.applianceToInstall = appliance;
      setTimeout(() => {
        this.stepper.next();
      }, 100);
    });
  }

  addAppliance(event): void {
    let name = event.target.files[0].name.split('-')[0];
    let fileName = event.target.files[0].name;
    let file = event.target.files[0];
    let fileReader: FileReader = new FileReader();
    let emulator;

    fileReader.onloadend = () => {
      let appliance = JSON.parse(fileReader.result as string);

      if (appliance.docker) emulator = 'docker';
      if (appliance.dynamips) emulator = 'dynamips';
      if (appliance.iou) emulator = 'iou';
      if (appliance.qemu) emulator = 'qemu';

      const url = this.applianceService.getUploadPath(this.controller, emulator, fileName);
      this.uploader.queue.forEach((elem) => (elem.url = url));

      const itemToUpload = this.uploader.queue[0];
      if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }])

      this.uploader.uploadItem(itemToUpload);
    };

    fileReader.readAsText(file);
  }

  filterAppliances(event) {
    let temporaryAppliances = this.allAppliances.filter((item) => {
      return item.name.toLowerCase().includes(this.searchText.toLowerCase());
    });

    if (this.category === 'all categories' || !this.category) {
      this.appliances = temporaryAppliances;
    } else {
      this.appliances = temporaryAppliances.filter((t) => t.category === this.category);
    }

    this.dataSource = new MatTableDataSource(this.appliances);
    this.dataSource.paginator = this.paginator;
  }

  setAction(action: string) {
    this.action = action;
    if (action === 'install') {
      this.actionTitle = 'Install appliance from controller';
    } else if (action === 'import') {
      this.actionTitle = 'Import an appliance file';
    }
  }

  setControllerType(controllerType: string) {
    this.isLocalComputerChosen = true;
  }

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') return;

    let appliances = this.appliances.slice();
    this.appliances = appliances.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      if (sort.active === 'name') {
        return compareNames(a.name, b.name, isAsc);
      } else if (sort.active === 'emulator') {
        return compareNames(a.emulator, b.emulator, isAsc);
      } else if (sort.active === 'vendor') {
        return compareNames(a.vendor_name, b.vendor_name, isAsc);
      } else return 0;
    });
  }

  onCloseClick() {
    this.dialogRef.close();
  }

  install(object: Appliance) {
    this.applianceToInstall = object;
    setTimeout(() => {
      this.stepper.next();
    }, 100);
  }

  showInfo(object: Appliance) {
    let dialogRef = this.dialog.open(ApplianceInfoDialogComponent, {
      width: '250px',
      data: { appliance: object },
    });
    dialogRef.componentInstance.appliance = object;
  }



  importImage(event, imageName) {
    this.computeChecksumMd5(event.target.files[0], false).then((output) => {
      let imageToInstall = this.applianceToInstall.images.filter((n) => n.filename === imageName)[0];

      if (imageToInstall.md5sum !== output) {
        this.progressService.deactivate();
        const dialogRef = this.dialog.open(InformationDialogComponent, {
          width: '400px',
          height: '200px',
          autoFocus: false,
          disableClose: true,
        });
        dialogRef.componentInstance.confirmationMessage = `This is not the correct file.
                    The MD5 sum is ${output} and should be ${imageToInstall.md5sum}. Do you want to accept it at your own risks?`;
        dialogRef.afterClosed().subscribe((answer: boolean) => {
          if (answer) {
            this.importImageFile(event);
            this.openSnackBar()
          } else {
            this.uploaderImage.clearQueue();
          }
        });
      } else {
        this.importImageFile(event);
        this.openSnackBar()
      }
    });
  }

  importImageFile(event) {
    let name = event.target.files[0].name.split('-')[0];
    let fileName = event.target.files[0].name;
    let file = event.target.files[0];
    let fileReader: FileReader = new FileReader();
    let emulator;

    fileReader.onloadend = () => {
      if (this.applianceToInstall.qemu) emulator = 'qemu';
      if (this.applianceToInstall.dynamips) emulator = 'dynamips';
      if (this.applianceToInstall.iou) emulator = 'iou';

      const url = this.applianceService.getUploadPath(this.controller, emulator, fileName);
      this.uploaderImage.queue.forEach((elem) => (elem.url = url));

      const itemToUpload = this.uploaderImage.queue[0];
      if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }])

      this.uploaderImage.uploadItem(itemToUpload);
    };

    //fileReader.readAsText(file); //web browser out ouf memory when upload large image file
    fileReader.onloadend(undefined);
  }

  cancelUploading() {
    this.uploaderImage.clearQueue();
    this.uploadServiceService.processBarCount(null)
    this.toasterService.warning('File upload cancelled');
    this.uploadServiceService.cancelFileUploading(false)

  }

  checkImageFromVersion(image: string): boolean {
    let imageToInstall = this.applianceToInstall.images.filter((n) => n.filename === image)[0];
    if (this.applianceToInstall.qemu) {
      if (this.qemuImages.filter((n) => n.checksum === imageToInstall.md5sum).length > 0) return true;
    } else if (this.applianceToInstall.dynamips) {
      if (this.iosImages.filter((n) => n.checksum === imageToInstall.md5sum).length > 0) return true;
    } else if (this.applianceToInstall.iou) {
      if (this.iouImages.filter((n) => n.checksum === imageToInstall.md5sum).length > 0) return true;
    }

    return false;
  }

  checkImages(version: Version): boolean {
    if (version.images.hdb_disk_image) {
      if (
        this.checkImageFromVersion(version.images.hda_disk_image) &&
        this.checkImageFromVersion(version.images.hdb_disk_image)
      )
        return true;
      return false;
    }

    if (this.checkImageFromVersion(version.images.hda_disk_image)) {
      return true;
    } else {
      return false;
    }
  }

  openConfirmationDialog(message: string, link: string) {
    const dialogRef = this.dialog.open(InformationDialogComponent, {
      width: '400px',
      height: '200px',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.componentInstance.confirmationMessage = message;

    dialogRef.afterClosed().subscribe((answer: boolean) => {
      if (answer) {
        window.open(link);
      }
    });
  }

  downloadImage(image: Image) {
    const directDownloadMessage: string =
      'Download will redirect you where the required file can be downloaded, you may have to be registered with the vendor in order to download the file.';
    const compressionMessage: string = `The file is compressed with ${image.compression}, it must be uncompressed first.`;

    if (image.direct_download_url) {
      if (image.compression) {
        this.openConfirmationDialog(compressionMessage, image.direct_download_url);
      } else {
        window.open(image.direct_download_url);
      }
    } else {
      this.openConfirmationDialog(directDownloadMessage, image.download_url);
    }
  }

  downloadImageFromVersion(image: string) {
    this.applianceToInstall.images.forEach((n) => {
      if (n.filename === image) this.downloadImage(n);
    });
  }

  getCategory() {
    if (this.applianceToInstall.category === 'multilayer_switch') {
      return 'switch';
    }
    return this.applianceToInstall.category;
  }

  createIouTemplate(image: Image) {
    let iouTemplate: IouTemplate = new IouTemplate();
    iouTemplate.nvram = this.applianceToInstall.iou.nvram;
    iouTemplate.ram = this.applianceToInstall.iou.ram;
    iouTemplate.ethernet_adapters = this.applianceToInstall.iou.ethernet_adapters;
    iouTemplate.serial_adapters = this.applianceToInstall.iou.serial_adapters;
    iouTemplate.startup_config = this.applianceToInstall.iou.startup_config;
    iouTemplate.builtin = this.applianceToInstall.builtin;
    iouTemplate.category = this.getCategory();
    iouTemplate.default_name_format = this.applianceToInstall.default_name_format;
    iouTemplate.symbol = this.applianceToInstall.symbol;
    iouTemplate.compute_id = 'local';
    iouTemplate.template_id = uuid();
    iouTemplate.path = image.filename;
    iouTemplate.template_type = 'iou';

    const dialogRef = this.dialog.open(TemplateNameDialogComponent, {
      width: '400px',
      height: '250px',
      autoFocus: false,
      disableClose: true,
      data: {
        name: this.applianceToInstall.name,
      },
    });
    dialogRef.componentInstance.controller = this.controller;
    dialogRef.afterClosed().subscribe((answer: string) => {
      if (answer) {
        iouTemplate.name = answer;
        this.iouService.addTemplate(this.controller, iouTemplate).subscribe((template) => {
          this.templateService.newTemplateCreated.next(template);
          this.toasterService.success('Template added');
          this.dialogRef.close();
        });
      } else {
        return false;
      }
    });
  }

  createIosTemplate(image: Image) {
    let iosTemplate: IosTemplate = new IosTemplate();
    iosTemplate.chassis = this.applianceToInstall.dynamips.chassis;
    iosTemplate.nvram = this.applianceToInstall.dynamips.nvram;
    iosTemplate.platform = this.applianceToInstall.dynamips.platform;
    iosTemplate.ram = this.applianceToInstall.dynamips.ram;
    iosTemplate.startup_config = this.applianceToInstall.dynamips.startup_config;
    iosTemplate.slot0 = this.applianceToInstall.dynamips.slot0;
    iosTemplate.slot1 = this.applianceToInstall.dynamips.slot1;
    iosTemplate.slot2 = this.applianceToInstall.dynamips.slot2;
    iosTemplate.slot3 = this.applianceToInstall.dynamips.slot3;
    iosTemplate.slot4 = this.applianceToInstall.dynamips.slot4;
    iosTemplate.slot5 = this.applianceToInstall.dynamips.slot5;
    iosTemplate.slot6 = this.applianceToInstall.dynamips.slot6;
    iosTemplate.slot7 = this.applianceToInstall.dynamips.slot7;
    iosTemplate.builtin = this.applianceToInstall.builtin;
    iosTemplate.category = this.getCategory();
    iosTemplate.default_name_format = this.applianceToInstall.default_name_format;
    iosTemplate.symbol = this.applianceToInstall.symbol;
    iosTemplate.compute_id = 'local';
    iosTemplate.template_id = uuid();
    iosTemplate.image = image.filename;
    iosTemplate.template_type = 'dynamips';

    const dialogRef = this.dialog.open(TemplateNameDialogComponent, {
      width: '400px',
      height: '250px',
      autoFocus: false,
      disableClose: true,
      data: {
        name: this.applianceToInstall.name,
      },
    });
    dialogRef.componentInstance.controller = this.controller;
    dialogRef.afterClosed().subscribe((answer: string) => {
      if (answer) {
        iosTemplate.name = answer;

        this.iosService.addTemplate(this.controller, iosTemplate).subscribe((template) => {
          this.templateService.newTemplateCreated.next((template as any) as Template);
          this.toasterService.success('Template added');
          this.dialogRef.close();
        });
      } else {
        return false;
      }
    });
  }

  createDockerTemplate() {
    let dockerTemplate: DockerTemplate = new DockerTemplate();
    dockerTemplate.adapters = this.applianceToInstall.docker.adapters;
    dockerTemplate.console_type = this.applianceToInstall.docker.console_type;
    dockerTemplate.builtin = this.applianceToInstall.builtin;
    dockerTemplate.category = this.getCategory();
    dockerTemplate.default_name_format = this.applianceToInstall.default_name_format;
    dockerTemplate.symbol = this.applianceToInstall.symbol;
    dockerTemplate.compute_id = 'local';
    dockerTemplate.template_id = uuid();
    dockerTemplate.image = this.applianceToInstall.docker.image;
    dockerTemplate.template_type = 'docker';

    const dialogRef = this.dialog.open(TemplateNameDialogComponent, {
      width: '400px',
      height: '250px',
      autoFocus: false,
      disableClose: true,
      data: {
        name: this.applianceToInstall.name,
      },
    });
    dialogRef.componentInstance.controller = this.controller;
    dialogRef.afterClosed().subscribe((answer: string) => {
      if (answer) {
        dockerTemplate.name = answer;

        this.dockerService.addTemplate(this.controller, dockerTemplate).subscribe((template) => {
          this.templateService.newTemplateCreated.next((template as any) as Template);
          this.toasterService.success('Template added');
          this.dialogRef.close();
        });
      } else {
        return false;
      }
    });
  }

  createQemuTemplateFromVersion(version: Version) {
    if (!this.checkImages(version)) {
      this.toasterService.error('Please install required images first');
      return;
    }

    let qemuTemplate: QemuTemplate = new QemuTemplate();
    qemuTemplate.ram = this.applianceToInstall.qemu.ram;
    qemuTemplate.adapters = this.applianceToInstall.qemu.adapters;
    qemuTemplate.adapter_type = this.applianceToInstall.qemu.adapter_type;
    qemuTemplate.boot_priority = this.applianceToInstall.qemu.boot_priority;
    qemuTemplate.console_type = this.applianceToInstall.qemu.console_type;
    qemuTemplate.hda_disk_interface = this.applianceToInstall.qemu.hda_disk_interface;
    qemuTemplate.hdb_disk_interface = this.applianceToInstall.qemu.hdb_disk_interface;
    qemuTemplate.hdc_disk_interface = this.applianceToInstall.qemu.hdc_disk_interface;
    qemuTemplate.hdd_disk_interface = this.applianceToInstall.qemu.hdd_disk_interface;
    qemuTemplate.builtin = this.applianceToInstall.builtin;
    qemuTemplate.category = this.getCategory();
    qemuTemplate.first_port_name = this.applianceToInstall.first_port_name;
    qemuTemplate.port_name_format = this.applianceToInstall.port_name_format;
    qemuTemplate.port_segment_size = this.applianceToInstall.port_segment_size;
    qemuTemplate.default_name_format = this.applianceToInstall.default_name_format
    qemuTemplate.symbol = this.applianceToInstall.symbol;
    qemuTemplate.compute_id = 'local';
    qemuTemplate.template_id = uuid();
    qemuTemplate.hda_disk_image = version.images.hda_disk_image;
    qemuTemplate.hdb_disk_image = version.images.hdb_disk_image;
    qemuTemplate.hdc_disk_image = version.images.hdc_disk_image;
    qemuTemplate.hdd_disk_image = version.images.hdd_disk_image;
    qemuTemplate.cdrom_image = version.images.cdrom_image;
    qemuTemplate.template_type = 'qemu';
    qemuTemplate.usage = this.applianceToInstall.usage;
    qemuTemplate.platform = this.applianceToInstall.qemu.arch;

    const dialogRef = this.dialog.open(TemplateNameDialogComponent, {
      width: '400px',
      height: '250px',
      autoFocus: false,
      disableClose: true,
      data: {
        name: this.applianceToInstall.name,
      },
    });
    dialogRef.componentInstance.controller = this.controller;
    dialogRef.afterClosed().subscribe((answer: string) => {
      if (answer) {
        qemuTemplate.name = answer;

        this.qemuService.addTemplate(this.controller, qemuTemplate).subscribe((template) => {
          this.templateService.newTemplateCreated.next((template as any) as Template);
          this.toasterService.success('Template added');
          this.dialogRef.close();
        });
      } else {
        return false;
      }
    });
  }

  private computeChecksumMd5(file: File, encode = false): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunkSize = 2097152;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      let cursor = 0;

      fileReader.onerror = function (): void {
        reject('MD5 computation failed - error reading the file');
      };

      function processChunk(chunkStart: number): void {
        const chunkEnd = Math.min(file.size, chunkStart + chunkSize);
        fileReader.readAsArrayBuffer(file.slice(chunkStart, chunkEnd));
      }

      fileReader.onload = function (e: any): void {
        spark.append(e.target.result);
        cursor += chunkSize;
        if (cursor < file.size) {
          processChunk(cursor);
        } else {
          resolve(spark.end(encode));
        }
      };

      processChunk(0);
    });
  }

  openSnackBar() {
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data:{upload_file_type:'Image'}
    });
  }

}

function compareNames(a: string, b: string, isAsc: boolean) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
