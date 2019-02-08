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


@Component({
    selector: 'app-add-ios-template',
    templateUrl: './add-ios-template.component.html',
    styleUrls: ['./add-ios-template.component.scss']
})
export class AddIosTemplateComponent implements OnInit {
    server: Server;
    iosTemplate: IosTemplate;
    isEtherSwitchRouter: boolean = false;

    iosImageForm: FormGroup;
    iosNameForm: FormGroup;
    iosMemoryForm: FormGroup;

    networkAdaptersForTemplate: string[] = [];
    networkModulesForTemplate: string[] = [];

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

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iosService: IosService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private router: Router,
        private templateMocksService: TemplateMocksService,
        private iosConfigurationService: IosConfigurationService
    ) {
        this.iosTemplate = new IosTemplate();

        this.iosImageForm = this.formBuilder.group({
            imageName: new FormControl(null, [Validators.required])
        });

        this.iosNameForm = this.formBuilder.group({
            templateName: new FormControl(null, [Validators.required])
        });

        this.iosMemoryForm = this.formBuilder.group({
            memory: new FormControl(null, [Validators.required])
        });
    }

    ngOnInit(){
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

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

    addTemplate() {
        if (!this.iosImageForm.invalid && !this.iosNameForm.invalid && !this.iosMemoryForm.invalid) {
            this.iosTemplate.template_id = uuid();

            if (this.isEtherSwitchRouter) {
                this.iosTemplate.symbol = ":/symbols/multilayer_switch.svg";
                this.iosTemplate.category = "switch";
            }

            if (this.networkAdaptersForTemplate.length>0) this.completeAdaptersData();
            if (this.networkModulesForTemplate.length>0) this.completeModulesData();

            this.iosService.addTemplate(this.server, this.iosTemplate).subscribe((template: IosTemplate) => {
                this.router.navigate(['/server', this.server.id, 'preferences', 'dynamips', 'templates']);
            });
        } else {
            this.toasterService.error(`Fill all required fields`);
        }
    }

    completeAdaptersData() {
        if (this.chassis[this.iosTemplate.platform]) {
            if(Object.keys(this.networkAdapters[this.iosTemplate.platform])){
                for(let i=0; i<Object.keys(this.networkAdapters[this.iosTemplate.platform]).length; i++){
                    if(!this.networkAdaptersForTemplate[i]) this.networkAdaptersForTemplate[i] = '';
                }
            }
        } else {
            if(Object.keys(this.networkAdaptersForPlatform[this.iosTemplate.platform])){
                for(let i=0; i<Object.keys(this.networkAdaptersForPlatform[this.iosTemplate.platform]).length; i++){
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
        if(Object.keys(this.networkModules[this.iosTemplate.platform])){
            for(let i=0; i<Object.keys(this.networkModules[this.iosTemplate.platform]).length; i++){
                if(!this.networkModulesForTemplate[i]) this.networkModulesForTemplate[i] = '';
            }
        }
        
        if (this.networkModulesForTemplate[0]) this.iosTemplate.wic0 = this.networkModulesForTemplate[0];
        if (this.networkModulesForTemplate[1]) this.iosTemplate.wic1 = this.networkModulesForTemplate[1];
        if (this.networkModulesForTemplate[2]) this.iosTemplate.wic2 = this.networkModulesForTemplate[2];
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
