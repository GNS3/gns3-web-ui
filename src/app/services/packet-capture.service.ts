import { Injectable } from '@angular/core';
import { Link } from '../models/link';
import { Project } from '../models/project';
import { Server } from '../models/server';
import { ProtocolHandlerService } from './protocol-handler.service';

@Injectable()
export class PacketCaptureService {

  constructor(private protocolHandlerService: ProtocolHandlerService) {}

  startCapture(server: Server, project: Project, link: Link, name: string) {

    const uri = `gns3+pcap://${server.host}:${server.port}?protocol=${server.protocol.slice(0, -1)}&project_id=${project.project_id}&link_id=${link.link_id}&project=${project.name}&name=${name}`;
    this.protocolHandlerService.open(uri);

  }
}
