import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { switchMap } from 'rxjs/operators';
import { QemuService } from '../../../../services/qemu.service';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';


@Component({
    selector: 'app-add-qemu-virtual-machine-template',
    templateUrl: './add-qemu-vm-template.component.html',
    styleUrls: ['./add-qemu-vm-template.component.scss']
})
export class AddQemuVmTemplateComponent implements OnInit {
    server: Server;
    qemuBinaries: QemuBinary[] = [];
    selectedBinary: QemuBinary;
    ramMemory: number;
    consoleTypes: string[] = ['telnet', 'vnc', 'spice', 'spice+agent', 'none'];
    selectedConsoleType: string;
    
    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private qemuService: QemuService
    ) {}

    ngOnInit() {
        this.route.paramMap
        .pipe(
          switchMap((params: ParamMap) => {
            const server_id = params.get('server_id');
            return this.serverService.get(parseInt(server_id, 10));
          })
        )
        .subscribe((server: Server) => {
            this.server = server;
            this.qemuService.getBinaries(server).subscribe((qemuBinaries: QemuBinary[]) => {
                this.qemuBinaries = qemuBinaries;
            });
        });
    }

    setradio(msg){
        console.log(msg);
    }
}
