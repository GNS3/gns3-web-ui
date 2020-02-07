import { Injectable } from "@angular/core";

@Injectable()
export class IosConfigurationService {
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

    getConsoleTypes() {
        return ['telnet', 'none'];
    }

    getDefaultRamSettings() {
        return {   
            "c1700": 160,
            "c2600": 160,
            "c2691": 192,
            "c3600": 192,
            "c3725": 128,
            "c3745": 256,
            "c7200": 512
        };
    }

    getDefaultNvRamSettings() {
        return {
            "c1700": 128,
            "c2600": 128,
            "c2691": 256,
            "c3600": 256,
            "c3725": 256,
            "c3745": 256,
            "c7200": 512
        };
    }

    getAvailablePlatforms() {
        return ["c1700", "c2600", "c2691", "c3725", "c3745", "c3600", "c7200"];
    }

    getPlatformsWithEtherSwitchRouterOption() {
        return {
            "c1700": false, 
            "c2600": true, 
            "c2691": true, 
            "c3725": true, 
            "c3745": true, 
            "c3600": true, 
            "c7200": false
        };
    }

    getPlatformsWithChassis() {
        return {
            "c1700": true, 
            "c2600": true, 
            "c2691": false, 
            "c3725": false, 
            "c3745": false, 
            "c3600": true, 
            "c7200": false
        };
    }

    getChassis() {
        return {
            "c1700": ["1720", "1721", "1750", "1751", "1760"],
            "c2600": ["2610", "2611", "2620", "2621", "2610XM", "2611XM", "2620XM", "2621XM", "2650XM", "2651XM"],
            "c3600": ["3620", "3640", "3660"]
        };
    }
    
    getNetworkModules() {
        return {
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
    }

    getNetworkAdapters() {
        return {
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
                6: this.c3600_nms
            }
        };
    }

    getNetworkAdaptersForPlatform() {
        return {
            "c2691": {
                0: ["GT96100-FE"],
                1: this.c3700_nms
            },
            "c3725": {
                0: ["GT96100-FE"],
                1:  this.c3700_nms,
                2:  this.c3700_nms
            },
            "c3745": {
                0: ["GT96100-FE"],
                1: this.c3700_nms,
                2: this.c3700_nms,
                3: this.c3700_nms,
                4: this.c3700_nms
            },
            "c7200": {
                0: this.c7200_io,
                1: this.c7200_pas,
                2: this.c7200_pas,
                3: this.c7200_pas,
                4: this.c7200_pas,
                5: this.c7200_pas,
                6: this.c7200_pas
            }
        };
    }
}
