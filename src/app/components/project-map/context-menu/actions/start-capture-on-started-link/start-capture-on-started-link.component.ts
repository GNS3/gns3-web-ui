import { Component, Input } from '@angular/core';
import { Link } from '../../../../../models/link';
import { Project } from '../../../../../models/project';
import { Controller } from '../../../../../models/controller';
import { PacketCaptureService } from '../../../../../services/packet-capture.service';

@Component({
  selector: 'app-start-capture-on-started-link-action',
  templateUrl: './start-capture-on-started-link.component.html',
})
export class StartCaptureOnStartedLinkActionComponent {
  @Input() controller:Controller ;
  @Input() project: Project;
  @Input() link: Link;

  constructor(private packetCaptureService: PacketCaptureService) {}

  startCapture() {
    var splittedFileName = this.link.capture_file_name.split('.');
    this.packetCaptureService.startCapture(this.controller, this.project, this.link, splittedFileName[0]);
  }
}
