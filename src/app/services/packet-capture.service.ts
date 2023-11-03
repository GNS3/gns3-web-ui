import { Injectable } from '@angular/core';
import { Link } from '../models/link';
import { Project } from '../models/project';
import{ Controller } from '../models/controller';

@Injectable()
export class PacketCaptureService {
  constructor() {}

  startCapture(controller:Controller , project: Project, link: Link, name: string) {
    location.assign(
      `gns3+pcap://${controller.host}:${controller.port}?protocol=${controller.protocol.slice(0, -1)}&project_id=${project.project_id}&link_id=${link.link_id}&project=${project.name}&name=${name}`
    );
  }
}
