import { Injectable } from "@angular/core";

@Injectable()
export class VirtualBoxConfigurationService {
    getConsoleTypes() {
        return ['telnet', 'none'];
    }

    getOnCloseoptions() {
        const onCloseOptions = [["Power off the VM", "power_off"], 
            ["Send the shutdown signal (ACPI)", "shutdown_signal"], 
            ["Save the VM state", "save_vm_state"]];

        return onCloseOptions;
    }

    getCategories() {
        const categories = [["Default", "guest"],
            ["Routers", "routers"],
            ["Switches", "switches"],
            ["End devices", "end_devices"],
            ["Security devices", "security_devices"]];

        return categories;
    }

    getNetworkTypes() {
        const networkTypes = ["PCnet-PCI II (Am79C970A)",
            "PCNet-FAST III (Am79C973)",
            "Intel PRO/1000 MT Desktop (82540EM)",
            "Intel PRO/1000 T Server (82543GC)",
            "Intel PRO/1000 MT Server (82545EM)",
            "Paravirtualized Network (virtio-net)"];

        return networkTypes;
    } 
}
