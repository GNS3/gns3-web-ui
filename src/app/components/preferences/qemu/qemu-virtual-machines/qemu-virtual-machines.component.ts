import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { ActivatedRoute } from '@angular/router';


@Component({
    selector: 'app-qemu-virtual-machines',
    templateUrl: './qemu-virtual-machines.component.html',
    styleUrls: ['./qemu-virtual-machines.component.scss']
})
export class QemuVirtualMachinesComponent implements OnInit {
    server: Server;

    constructor(
        private route: ActivatedRoute
    ) {}

    ngOnInit() {}
}
