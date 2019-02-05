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

    platforms: string[] = ["c1700", "c2600", "c2691", "c3725", "c3745", "c3600", "c7200"];
    platformsWithEtherSwitchRouterOption = {
        "c1700": false, 
        "c2600": true, 
        "c2691": true, 
        "c3725": true, 
        "c3745": true, 
        "c3600": true, 
        "c7200": false
    };
    platformsWithChassis = {
        "c1700": true, 
        "c2600": true, 
        "c2691": false, 
        "c3725": false, 
        "c3745": false, 
        "c3600": true, 
        "c7200": false
    };
    chassis = {
        "c1700": ["1720", "1721", "1750", "1751", "1760"],
        "c2600": ["2610", "2611", "2620", "2621", "2610XM", "2611XM", "2620XM", "2621XM", "2650XM", "2651XM"],
        "c3600": ["3620", "3640", "3660"]
    };
    defaultRam = {
        "c1700": 160,
        "c2600": 160,
        "c2691": 192,
        "c3600": 192,
        "c3725": 128,
        "c3745": 256,
        "c7200": 512
    };
    defaultNvram = {
        "c1700": 128,
        "c2600": 128,
        "c2691": 256,
        "c3600": 256,
        "c3725": 256,
        "c3745": 256,
        "c7200": 512
    };
    ciscoUrl: string = "https://cfn.cloudapps.cisco.com/ITDIT/CFN/jsp/SearchBySoftware.jsp";
    
    c1700_wics = ["WIC-1T", "WIC-2T", "WIC-1ENET"];
    c2600_wics = ["WIC-1T", "WIC-2T"];
    c3700_wics = ["WIC-1T", "WIC-2T"];

    c2600_nms = [
        "NM-1FE-TX",
        "NM-1E",
        "NM-4E",
        "NM-16ESW"
    ];
    c3600_nms = [
        "NM-1FE-TX",
        "NM-1E",
        "NM-4E",
        "NM-16ESW",
        "NM-4T"
    ];
    c3700_nms = [
        "NM-1FE-TX",
        "NM-4T",
        "NM-16ESW",
    ];
    c7200_pas = [
        "PA-A1",
        "PA-FE-TX",
        "PA-2FE-TX",
        "PA-GE",
        "PA-4T+",
        "PA-8T",
        "PA-4E",
        "PA-8E",
        "PA-POS-OC3",
    ];
    c7200_io = [
        "C7200-IO-FE",
        "C7200-IO-2FE",
        "C7200-IO-GE-E"
    ];

    networkAdapters = {
        "1720": {
            0: ["C1700-MB-1FE"]
        },
        "1721": {
            0: ["C1700-MB-1FE"]
        },
        "1750": {
            0: ["C1700-MB-1FE"]
        },
        "1751": {
            0: ["C1700-MB-1FE"],
            1: ["C1700-MB-WIC1"]
        },
        "1760": {
            0: ["C1700-MB-1FE"],
            1: ["C1700-MB-WIC1"]
        },
        "2610": {
            0: ["C2600-MB-1E"],
            1: this.c2600_nms
        }, 
        "2611": {
            0: ["C2600-MB-2E"],
            1: this.c2600_nms
        }, 
        "2620": {
            0: ["C2600-MB-1FE"],
            1: this.c2600_nms
        }, 
        "2621": {
            0: ["C2600-MB-2FE"],
            1: this.c2600_nms
        }, 
        "2610XM": {
            0: ["C2600-MB-1FE"],
            1: this.c2600_nms
        }, 
        "2611XM": {
            0: ["C2600-MB-2FE"],
            1: this.c2600_nms
        }, 
        "2620XM": {
            0: ["C2600-MB-1FE"],
            1: this.c2600_nms
        }, 
        "2621XM": {
            0: ["C2600-MB-2FE"],
            1: this.c2600_nms
        }, 
        "2650XM": {
            0: ["C2600-MB-1FE"],
            1: this.c2600_nms
        }, 
        "2651XM": {
            0: ["C2600-MB-2FE"],
            1: this.c2600_nms
        }, 
        "3620": {
            0: this.c3600_nms,
            1: this.c3600_nms
        }, 
        "3640": {
            0: this.c3600_nms,
            1: this.c3600_nms,
            2: this.c3600_nms,
            3: this.c3600_nms
        }, 
        "3660": {
            0: ["Leopard-2FE"],
            1: this.c3600_nms,
            2: this.c3600_nms,
            3: this.c3600_nms,
            4: this.c3600_nms,
            5: this.c3600_nms,
            6: this.c3600_nms,
            7: this.c3600_nms
        }
    };
    networkAdaptersForPlatform = {
        "c2691": {
            0: ["GT96100-FE"],
            1: this.c3700_nms
        },
        "c3725": {
            0: ["GT96100-FE"],
            1:  this.c3700_nms,
            2:  this.c3700_nms,
            3:  this.c3700_nms
        },
        "c3745": {
            0: ["GT96100-FE"],
            1: this.c3700_nms,
            2: this.c3700_nms,
            3: this.c3700_nms,
            4: this.c3700_nms,
            5: this.c3700_nms
        },
        "c7200": {
            0: this.c7200_io,
            1: this.c7200_pas,
            2: this.c7200_pas,
            3: this.c7200_pas,
            4: this.c7200_pas,
            5: this.c7200_pas,
            6: this.c7200_pas,
            7: this.c7200_pas
        }
    };
    networkModules = {
        "c1700": {
            0: this.c1700_wics,
            1: this.c1700_wics
        },
        "c2600": {
            0: this.c2600_wics,
            1: this.c2600_wics,
            2: this.c2600_wics
        },
        "c2691": {
            0: this.c3700_wics,
            1: this.c3700_wics,
            2: this.c3700_wics
        },
        "c3725": {
            0: this.c3700_wics,
            1: this.c3700_wics,
            2: this.c3700_wics
        },
        "c3745": {
            0: this.c3700_wics,
            1: this.c3700_wics,
            2: this.c3700_wics
        }
    };

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private iosService: IosService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private router: Router,
        private templateMocksService: TemplateMocksService
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
            });
        });
    }

    addTemplate() {
        if (!this.iosImageForm.invalid) {
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
