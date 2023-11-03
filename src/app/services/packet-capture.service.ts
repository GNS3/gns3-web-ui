import { Injectable } from '@angular/core';
import { Link } from '../models/link';
import { Project } from '../models/project';
import { Server } from '../models/server';

@Injectable()
export class PacketCaptureService {
  constructor() {}

  startCapture(server: Server, project: Project, link: Link, name: string) {
    location.assign(
      `gns3+pcap://${server.host}:${server.port}?protocol=${server.protocol.slice(0, -1)}&project_id=${project.project_id}&link_id=${link.link_id}&project=${project.name}&name=${name}`
    );
  }
}
