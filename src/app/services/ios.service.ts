import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Observable } from 'rxjs';
import { IosTemplate } from '../models/templates/ios-template';
import { IosImage } from '../models/images/ios-image';

@Injectable()
export class IosService {
    constructor(private httpServer: HttpServer) {}

    getImages(server: Server): Observable<IosImage[]> {
        return this.httpServer.get<IosImage[]>(server, '/compute/dynamips/images') as Observable<IosImage[]>;
    } 

    getImagePath(server: Server, filename: string): string {
        return `http://${server.host}:${server.port}/v2/compute/dynamips/images/${filename}`;
    }

    getTemplates(server: Server): Observable<IosTemplate[]> {
        return this.httpServer.get<IosTemplate[]>(server, '/templates') as Observable<IosTemplate[]>;
    }

    getTemplate(server: Server, template_id: string): Observable<IosTemplate> {
        return this.httpServer.get<IosTemplate>(server, `/templates/${template_id}`) as Observable<IosTemplate>;
    }

    addTemplate(server: Server, iosTemplate: IosTemplate): Observable<IosTemplate> {
        return this.httpServer.post<IosTemplate>(server, `/templates`, iosTemplate) as Observable<IosTemplate>;
    }

    saveTemplate(server: Server, iosTemplate: IosTemplate): Observable<IosTemplate> {
        return this.httpServer.put<IosTemplate>(server, `/templates/${iosTemplate.template_id}`, iosTemplate) as Observable<IosTemplate>;
    }
}
