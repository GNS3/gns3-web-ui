import { Injectable } from '@angular/core';
import { Link } from '../models/link';
import { Project } from '../models/project';
import { Server } from '../models/server';

@Injectable()
export class PacketCaptureService {
  constructor() {}

  startCapture(controller: Server, project: Project, link: Link, name: string) {
    location.assign(
      `gns3+pcap://${controller.host}:${controller.port}?project_id=${project.project_id}&link_id=${link.link_id}&name=${name}`
    );
  }
}
