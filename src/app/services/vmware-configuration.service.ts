import { Injectable } from "@angular/core";

@Injectable()
export class VmwareConfigurationService {
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
        const networkTypes = ["default",
            "e1000",
            "e1000e",
            "flexible",
            "vlance",
            "vmxnet",
            "vmxnet2",
            "vmxnet3"];

        return networkTypes;
    } 
}
