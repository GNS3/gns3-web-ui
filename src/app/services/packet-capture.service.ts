import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Project } from '../models/project';
import { Link } from '../models/link';

@Injectable()
export class PacketCaptureService {
    constructor(private httpServer: HttpServer) {}

    startCapture(server: Server, project: Project, link: Link, name: string) {
        location.assign(`gns3+pcap://${server.host}:${server.port}?project_id=${project.project_id}&link_id=${link.link_id}&name=${name}`);
    }
}
