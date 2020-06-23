import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Observable } from 'rxjs';
import { QemuTemplate } from '../models/templates/qemu-template';
import { Server } from '../models/server';
import { QemuBinary } from '../models/qemu/qemu-binary';
import { QemuImage } from '../models/qemu/qemu-image';
import { QemuImg } from '../models/qemu/qemu-img';

@Injectable()
export class QemuService {
    constructor(private httpServer: HttpServer) {}

    getTemplates(server: Server): Observable<QemuTemplate[]> {
        return this.httpServer.get<QemuTemplate[]>(server, '/templates') as Observable<QemuTemplate[]>;
    }

    getTemplate(server: Server, template_id: string): Observable<QemuTemplate> {
        return this.httpServer.get<QemuTemplate>(server, `/templates/${template_id}`) as Observable<QemuTemplate>;
    } 

    getImagePath(server: Server, filename: string): string {
        return `http://${server.host}:${server.port}/v2/compute/qemu/images/${filename}`;
    }

    getBinaries(server: Server): Observable<QemuBinary[]> {
        return this.httpServer.get<QemuBinary[]>(server, '/computes/local/qemu/binaries') as Observable<QemuBinary[]>;
    }

    getImages(server: Server): Observable<any> {
        return this.httpServer.get<QemuImage[]>(server, '/compute/qemu/images') as Observable<QemuImage[]>;
    }

    addImage(server: Server, qemuImg: QemuImg): Observable<QemuImg> {
        return this.httpServer.post<QemuImg>(server, '/compute/qemu/img', qemuImg) as Observable<QemuImg>;
    }
 
    addTemplate(server: Server, qemuTemplate: QemuTemplate): Observable<QemuTemplate> {
        return this.httpServer.post<QemuTemplate>(server, `/templates`, qemuTemplate) as Observable<QemuTemplate>;
    }

    saveTemplate(server: Server, qemuTemplate: QemuTemplate): Observable<QemuTemplate> {
        return this.httpServer.put<QemuTemplate>(server, `/templates/${qemuTemplate.template_id}`, qemuTemplate) as Observable<QemuTemplate>;
    }
}
