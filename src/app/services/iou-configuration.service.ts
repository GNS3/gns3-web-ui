import { Injectable } from "@angular/core";

@Injectable()
export class IouConfigurationService {
    getConsoleTypes() {
        return ['telnet', 'none'];
    }

    getCategories() {
        const categories = [["Default", "guest"],
            ["Routers", "router"],
            ["Switches", "switch"],
            ["End devices", "end_device"],
            ["Security devices", "security_device"]];

        return categories;
    }
}
