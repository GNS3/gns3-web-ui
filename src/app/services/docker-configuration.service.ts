import { Injectable } from "@angular/core";

@Injectable()
export class DockerConfigurationService {
    getConsoleTypes() {
        return ['telnet', 'vnc', 'http', 'https', 'none'];
    }

    getCategories() {
        const categories = [["Default", "guest"],
            ["Routers", "routers"],
            ["Switches", "switches"],
            ["End devices", "end_devices"],
            ["Security devices", "security_devices"]];

        return categories;
    }

    getConsoleResolutions() {
        const consoleResolutions = [
            '1920x1080',
            '1366x768',
            '1280x1024',
            '1280x800',
            '1024x768',
            '800x600',
            '640x480'
        ];

        return consoleResolutions;
    }
}
