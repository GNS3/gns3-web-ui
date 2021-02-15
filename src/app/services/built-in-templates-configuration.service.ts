import { Injectable } from "@angular/core";

@Injectable()
export class BuiltInTemplatesConfigurationService {
    getCategoriesForCloudNodes() {
        let categories = [["Default", "guest"],
            ["Routers", "router"],
            ["Switches", "switch"],
            ["End devices", "end_device"],
            ["Security devices", "security_device"]];

        return categories;
    }

    getConsoleTypesForCloudNodes() {
        return ['telnet', 'none'];
    }

    getCategoriesForEthernetHubs() {
        let categories = [["Default", "guest"],
            ["Routers", "router"],
            ["Switches", "switch"],
            ["End devices", "end_device"],
            ["Security devices", "security_device"]];

        return categories;
    }

    getCategoriesForEthernetSwitches() {
        let categories = [["Default", "guest"],
            ["Routers", "router"],
            ["Switches", "switch"],
            ["End devices", "end_device"],
            ["Security devices", "security_device"]];

        return categories;
    }

    getConsoleTypesForEthernetSwitches() {
        return ['telnet', 'none'];
    }

    getPortTypesForEthernetSwitches() {
        return ['access', 'dot1q', 'qinq'];
    }

    getEtherTypesForEthernetSwitches() {
        return ['0x8100', '0x88A8', '0x9100', '0x9200'];
    }
}
