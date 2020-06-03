import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosService } from '../../../../services/ios.service';
import { v4 as uuid } from 'uuid';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';
import { IosImage } from '../../../../models/images/ios-image';
import { FileUploader, FileItem, ParsedResponseHeaders } from 'ng2-file-upload';
import { ServerResponse } from '../../../../models/serverResponse';
import { ComputeService } from '../../../../services/compute.service';
import { Compute } from '../../../../models/compute';

@Component({
    selector: 'app-add-ios-template',
    templateUrl: './add-ios-template.component.html',
    styleUrls: ['./add-ios-template.component.scss', '../../preferences.component.scss']
})
export class AddIosTemplateComponent implements OnInit {
    server: Server;
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

    ciscoUrl: string = "https://cfn.cloudapps.cisco.com/ITDIT/CFN/jsp/SearchBySoftware.jsp";
    uploader: FileUploader;

    isGns3VmAvailable: boolean = false;
    isGns3VmChosen: boolean = false;
    isLocalComputerChosen: boolean = true;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iosService: IosService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private router: Router,
        private templateMocksService: TemplateMocksService,
        private iosConfigurationService: IosConfigurationService,
        private computeService: ComputeService
    ) {
        this.iosTemplate = new IosTemplate();

        this.iosImageForm = this.formBuilder.group({
            imageName: new FormControl(null, [Validators.required])
        });

        this.iosNameForm = this.formBuilder.group({
            templateName: new FormControl(null, [Validators.required]),
            platform: new FormControl(null, [Validators.required]),
            chassis: new FormControl(null, [Validators.required])
        });

        this.iosMemoryForm = this.formBuilder.group({
            memory: new FormControl(null, [Validators.required])
        });
    }

    ngOnInit() {
        this.uploader = new FileUploader({});
        this.uploader.onAfterAddingFile = file => {
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

        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

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

            this.computeService.getComputes(server).subscribe((computes: Compute[]) => {
                if (computes.filter(compute => compute.compute_id === 'vm').length > 0) this.isGns3VmAvailable = true;
            });
        });
    }

    setServerType(serverType: string) {
        if (serverType === 'gns3 vm' && this.isGns3VmAvailable) {
            this.isGns3VmChosen = true;
            this.isLocalComputerChosen = false;
        } else {
            this.isGns3VmChosen = false;
            this.isLocalComputerChosen = true;
        }
    }

    getImages() {
        this.iosService.getImages(this.server).subscribe((images: IosImage[]) => {
            this.iosImages = images;
        });
    }

    addImage(event): void {
        let name = event.target.files[0].name.split('-')[0];
        this.iosNameForm.controls['templateName'].setValue(name);
        let fileName = event.target.files[0].name;

        const url = this.iosService.getImagePath(this.server, fileName);
        this.uploader.queue.forEach(elem => (elem.url = url));

        const itemToUpload = this.uploader.queue[0];
        (itemToUpload as any).options.disableMultipart = true;

        this.uploader.uploadItem(itemToUpload);
    }

    addTemplate() {
        if (!this.iosImageForm.invalid && !this.iosMemoryForm.invalid && this.iosNameForm.get('templateName').value && this.iosNameForm.get('platform').value) {
            this.iosTemplate.template_id = uuid();
            this.iosTemplate.image = this.iosImageForm.get("imageName").value;
            this.iosTemplate.name = this.iosNameForm.get('templateName').value;
            this.iosTemplate.platform = this.iosNameForm.get('platform').value;

            if (this.chassis[this.iosNameForm.get('platform').value]) this.iosTemplate.chassis = this.iosNameForm.get('chassis').value;
            this.iosTemplate.ram = this.iosMemoryForm.get('memory').value;

            if (this.isEtherSwitchRouter) {
                this.iosTemplate.symbol = ":/symbols/multilayer_switch.svg";
                this.iosTemplate.category = "switch";
            }

            if (this.networkAdaptersForTemplate.length>0) this.completeAdaptersData();
            if (this.networkModulesForTemplate.length>0) this.completeModulesData();

            this.iosTemplate.compute_id = this.isGns3VmChosen ? 'vm' : 'local';

            this.iosService.addTemplate(this.server, this.iosTemplate).subscribe((template: IosTemplate) => {
                this.goBack();
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }

    completeAdaptersData() {
        if (this.chassis[this.iosTemplate.platform]) {
            if(Object.keys(this.networkAdapters[this.iosTemplate.chassis])){
                for(let i=0; i<Object.keys(this.networkAdapters[this.iosTemplate.chassis]).length; i++){
                    if(!this.networkAdaptersForTemplate[i]) this.networkAdaptersForTemplate[i] = '';
                }
            }
        } else {
            if(this.networkAdaptersForPlatform[this.iosNameForm.get('platform').value]){
                for(let i=0; i<Object.keys(this.networkAdaptersForPlatform[this.iosNameForm.get('platform').value]).length; i++){
                    if(!this.networkAdaptersForTemplate[i]) this.networkAdaptersForTemplate[i] = '';
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
        if (Object.keys(this.networkModules[this.iosTemplate.platform])){
            for(let i=0; i<Object.keys(this.networkModules[this.iosTemplate.platform]).length; i++){
                if(!this.networkModulesForTemplate[i]) this.networkModulesForTemplate[i] = '';
            }
        }
        
        if (this.networkModulesForTemplate[0]) this.iosTemplate.wic0 = this.networkModulesForTemplate[0];
        if (this.networkModulesForTemplate[1]) this.iosTemplate.wic1 = this.networkModulesForTemplate[1];
        if (this.networkModulesForTemplate[2]) this.iosTemplate.wic2 = this.networkModulesForTemplate[2];
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'dynamips', 'templates']);
    }

    onImageChosen() {
        let name: string = this.iosImageForm.get("imageName").value.split('-')[0];
        this.iosNameForm.controls['templateName'].setValue(name);

        if (this.platforms.includes(name.split('-')[0])) {
            this.iosNameForm.controls['platform'].setValue(name);
            this.selectedPlatform = name;

            this.iosNameForm.controls['chassis'].setValue('');
            this.iosMemoryForm.controls['memory'].setValue(this.defaultRam[name]);
        }
    }

    onPlatformChosen() {
        this.iosTemplate.chassis = '';
        this.networkAdaptersForTemplate = [];
        this.networkModulesForTemplate = [];
    }

    onChassisChosen() {
        this.networkAdaptersForTemplate = [];
    }
}
