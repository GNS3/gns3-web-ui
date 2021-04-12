import { Component, OnInit } from '@angular/core';
import { Server } from '../../../../models/server';
import { Link } from '../../../../models/link';
import { MatDialogRef } from '@angular/material/dialog';
import { PacketFiltersDialogComponent } from '../packet-filters/packet-filters.component';
import { LinkService } from '../../../../services/link.service';
import { CapturingSettings } from '../../../../models/capturingSettings';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToasterService } from '../../../../services/toaster.service';
import { LinkNode } from '../../../../models/link-node';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { PacketCaptureService } from '../../../../services/packet-capture.service';
import { Project } from '../../../../models/project';

@Component({
  selector: 'app-start-capture',
  templateUrl: './start-capture.component.html',
  styleUrls: ['./start-capture.component.scss'],
})
export class StartCaptureDialogComponent implements OnInit {
  server: Server;
  project: Project;
  link: Link;
  linkTypes = [];
  inputForm: FormGroup;
  startProgram: boolean;

  constructor(
    private dialogRef: MatDialogRef<PacketFiltersDialogComponent>,
    private linkService: LinkService,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService,
    private nodesDataSource: NodesDataSource,
    private packetCaptureService: PacketCaptureService
  ) {
    this.inputForm = this.formBuilder.group({
      linkType: new FormControl('', Validators.required),
      fileName: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    if (this.link.link_type === 'ethernet') {
      this.linkTypes = [['Ethernet', 'DLT_EN10MB']];
    } else {
      this.linkTypes = [
        ['Cisco HDLC', 'DLT_C_HDLC'],
        ['Cisco PPP', 'DLT_PPP_SERIAL'],
        ['Frame Relay', 'DLT_FRELAY'],
        ['ATM', 'DLT_ATM_RFC1483'],
      ];
    }

    const sourceNode = this.nodesDataSource.get(this.link.nodes[0].node_id);
    const targetNode = this.nodesDataSource.get(this.link.nodes[1].node_id);
    const sourcePort = sourceNode.ports[this.link.nodes[0].port_number];
    const targetPort = targetNode.ports[this.link.nodes[1].port_number];
    this.inputForm.controls['fileName'].setValue(
      `${sourceNode.name}_${sourcePort.name}_to_${targetNode.name}_${targetPort.name}`
    );
  }

  onYesClick() {
    let isAnyRunningDevice = false;
    this.link.nodes.forEach((linkNode: LinkNode) => {
      let node = this.nodesDataSource.get(linkNode.node_id);
      if (node.status === 'started') isAnyRunningDevice = true;
    });

    if (!isAnyRunningDevice) {
      this.toasterService.error(`Cannot capture because there is no running device on this link`);
    } else if (this.inputForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      let captureSettings: CapturingSettings = {
        capture_file_name: this.inputForm.get('fileName').value,
        data_link_type: this.inputForm.get('linkType').value,
      };

      if (this.startProgram) {
        this.packetCaptureService.startCapture(this.server, this.project, this.link, captureSettings.capture_file_name);
      }

      this.linkService.startCaptureOnLink(this.server, this.link, captureSettings).subscribe(() => {
        this.dialogRef.close();
      });
    }
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
