import { Injectable } from "@angular/core";
import { Server } from '../models/server';
import { Project } from '../models/project';
import { Link } from '../models/link';

@Injectable()
export class PacketCaptureService {
    constructor() {}

    startCapture(server: Server, project: Project, link: Link, name: string) {
        location.assign(`gns3+pcap://${server.host}:${server.port}?project_id=${project.project_id}&link_id=${link.link_id}&name=${name}`);
    }
}
