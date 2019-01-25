import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { QemuService } from '../../../../services/qemu.service';
import { Server } from '../../../../models/server';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { ToasterService } from '../../../../services/toaster.service';


@Component({
    selector: 'app-qemu-virtual-machine-template-details',
    templateUrl: './qemu-vm-template-details.component.html',
    styleUrls: ['./qemu-vm-template-details.component.scss']
})
export class QemuVmTemplateDetailsComponent implements OnInit {
    server: Server;
    qemuTemplate: QemuTemplate;

    consoleTypes: string[] = ['telnet', 'vnc', 'spice', 'spice+agent', 'none'];
    diskInterfaces: string[] = ['ide', 'sata', 'scsi', 'sd', 'mtd', 'floppy', 'pflash', 'virtio', 'none'];
    networkTypes = [["e1000", "Intel Gigabit Ethernet"],
                    ["i82550", "Intel i82550 Ethernet"],
                    ["i82551", "Intel i82551 Ethernet"],
                    ["i82557a", "Intel i82557A Ethernet"],
                    ["i82557b", "Intel i82557B Ethernet"],
                    ["i82557c", "Intel i82557C Ethernet"],
                    ["i82558a", "Intel i82558A Ethernet"],
                    ["i82558b", "Intel i82558B Ethernet"],
                    ["i82559a", "Intel i82559A Ethernet"],
                    ["i82559b", "Intel i82559B Ethernet"],
                    ["i82559c", "Intel i82559C Ethernet"],
                    ["i82559er", "Intel i82559ER Ethernet"],
                    ["i82562", "Intel i82562 Ethernet"],
                    ["i82801", "Intel i82801 Ethernet"],
                    ["ne2k_pci", "NE2000 Ethernet"],
                    ["pcnet", "AMD PCNet Ethernet"],
                    ["rtl8139", "Realtek 8139 Ethernet"],
                    ["virtio", "Legacy paravirtualized Network I/O"],
                    ["virtio-net-pci", "Paravirtualized Network I/O"],
                    ["vmxnet3", "VMWare Paravirtualized Ethernet v3"]];
    bootPriorities = [["HDD", "c"],
                    ["CD/DVD-ROM", "d"], 
                    ["Network", "n"], 
                    ["HDD or Network", "cn"], 
                    ["HDD or CD/DVD-ROM", "cd"]];
    onCloseOptions = [["Power off the VM", "power_off"], 
                    ["Send the shutdown signal (ACPI)", "shutdown_signal"], 
                    ["Save the VM state", "save_vm_state"]];
    categories = [["Default", "guest"],
                    ["Routers", "routers"],
                    ["Switches", "switches"],
                    ["End devices", "end_devices"],
                    ["Security devices", "security_devices"]];
    priorities = ["realtime",
                "very high",
                "high",
                "normal",
                "low",
                "very low"];
    binaries: QemuBinary[] = [];
    activateCpuThrottling: boolean = true;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService,
        private toasterService: ToasterService
    ){}

    ngOnInit(){
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
            this.qemuService.getTemplate(this.server, template_id).subscribe((qemuTemplate: QemuTemplate) => {
                this.qemuTemplate = qemuTemplate;

                this.qemuService.getBinaries(server).subscribe((qemuBinaries: QemuBinary[]) => {
                    this.binaries = qemuBinaries;
                });
            });
        });
    }

    uploadCdromImageFile(event){
        this.qemuTemplate.cdrom_image = event.target.files[0].name;
    }

    uploadInitrdFile(event){
        this.qemuTemplate.initrd = event.target.files[0].name;
    }

    uploadKernelImageFile(event){
        this.qemuTemplate.kernel_image = event.target.files[0].name;
    }

    uploadBiosFile(event){
        this.qemuTemplate.bios_image = event.target.files[0].name;
    }

    onSave(){
        if (!this.activateCpuThrottling){
            this.qemuTemplate.cpu_throttling = 0;
        }

        this.qemuService.saveTemplate(this.server, this.qemuTemplate).subscribe((savedTemplate: QemuTemplate) => {
            this.toasterService.success("Changes saved")
        });
    }
}
