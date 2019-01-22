import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Observable } from 'rxjs';
import { QemuTemplate } from '../models/templates/qemu-template';
import { Server } from '../models/server';
import { QemuBinary } from '../models/qemu/qemu-binary';

@Injectable()
export class QemuService {
    constructor(private httpServer: HttpServer) {}

    getTemplates(server: Server): Observable<QemuTemplate[]> {
        return this.httpServer.get<QemuTemplate[]>(server, '/templates') as Observable<QemuTemplate[]>;
    }

    getBinaries(server: Server): Observable<QemuBinary[]> {
        return this.httpServer.get<QemuBinary[]>(server, '/computes/local/qemu/binaries') as Observable<QemuBinary[]>;
    }
}
