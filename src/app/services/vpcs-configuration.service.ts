import { Injectable } from "@angular/core";

@Injectable()
export class VpcsConfigurationService {
    getConsoleTypes(){
        return ['telnet', 'none'];
    }

    getCategories(){
        let categories = [["Default", "guest"],
            ["Routers", "routers"],
            ["Switches", "switches"],
            ["End devices", "end_devices"],
            ["Security devices", "security_devices"]];

        return categories;
    }
}
