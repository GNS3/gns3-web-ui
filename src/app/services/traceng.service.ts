import { HttpHeaders } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { Server } from '../models/server';
import { TracengTemplate } from '../models/templates/traceng-template';
import { HttpServer } from './http-server.service';

@Injectable()
export class TracengService {
    constructor(private httpServer: HttpServer) {}

    getTemplates(server: Server): Observable<TracengTemplate[]> {
        return this.httpServer.get<TracengTemplate[]>(server, '/templates') as Observable<TracengTemplate[]>;
    }

    getTemplate(server: Server, template_id: string): Observable<TracengTemplate> {
        return this.httpServer.get<TracengTemplate>(server, `/templates/${template_id}`) as Observable<TracengTemplate>;
    }

    addTemplate(server: Server, vpcsTemplate: TracengTemplate): Observable<TracengTemplate> {
        return this.httpServer.post<TracengTemplate>(server, `/templates`, vpcsTemplate) as Observable<TracengTemplate>;
    }

    saveTemplate(server: Server, vpcsTemplate: TracengTemplate): Observable<TracengTemplate> {
        return this.httpServer.put<TracengTemplate>(server, `/templates/${vpcsTemplate.template_id}`, vpcsTemplate) as Observable<TracengTemplate>;
    }
}
