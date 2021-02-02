import { Injectable } from "@angular/core";

@Injectable()
export class IouConfigurationService {
    getConsoleTypes() {
        return ['telnet', 'none'];
    }

    getCategories() {
        let categories = [["Default", "guest"],
            ["Routers", "router"],
            ["Switches", "switch"],
            ["End devices", "guest"],
            ["Security devices", "firewall"]];

        return categories;
    }
}
