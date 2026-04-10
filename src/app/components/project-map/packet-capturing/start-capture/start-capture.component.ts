import { ChangeDetectionStrategy, Component, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { CapturingSettings } from '@models/capturingSettings';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { PacketCaptureService } from '@services/packet-capture.service';
import { ToasterService } from '@services/toaster.service';
import { PacketFiltersDialogComponent } from '../packet-filters/packet-filters.component';

@Component({
  selector: 'app-start-capture',
  templateUrl: './start-capture.component.html',
  styleUrl: './start-capture.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartCaptureDialogComponent implements OnInit {
  controller: Controller;
  project: Project;
  link: Link;
  linkTypes = [];
  inputForm: UntypedFormGroup;
  readonly startProgram = model(false);
  readonly webWireshark = model(false);  // Web Wireshark checkbox
  readonly openWebWireshark = model(false);  // Auto-open Web Wireshark

  // Loading states
  readonly isLoading = signal(false);
  readonly loadingMessage = signal('');
  readonly errorMessage = signal('');

  private dialogRef = inject(MatDialogRef<PacketFiltersDialogComponent>);
  private linkService = inject(LinkService);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private nodesDataSource = inject(NodesDataSource);
  private packetCaptureService = inject(PacketCaptureService);

  constructor() {
    this.inputForm = this.formBuilder.group({
      linkType: new UntypedFormControl('', Validators.required),
      fileName: new UntypedFormControl('', Validators.required),
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
      `${sourceNode.name}_${sourcePort.name}_to_${targetNode.name}_${targetPort.name}`.replace(
        new RegExp('[^0-9A-Za-z_-]', 'g'),
        ''
      )
    );
  }

  onYesClick() {
    // Clear previous error
    this.errorMessage.set('');

    let isAnyRunningDevice = false;
    this.link.nodes.forEach((linkNode: LinkNode) => {
      let node = this.nodesDataSource.get(linkNode.node_id);
      if (node.status === 'started') isAnyRunningDevice = true;
    });

    if (!isAnyRunningDevice) {
      this.toasterService.error(`Cannot capture because there is no running device on this link`);
      return;
    }

    if (this.inputForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
      return;
    }

    let captureSettings: CapturingSettings = {
      capture_file_name: this.inputForm.get('fileName').value,
      data_link_type: this.inputForm.get('linkType').value,
      wireshark: this.webWireshark(),
    };

    // Show loading state for Web Wireshark
    if (this.webWireshark()) {
      this.isLoading.set(true);
      this.loadingMessage.set('Starting Web Wireshark, please wait...');

      this.linkService.startCaptureOnLink(this.controller, this.link, captureSettings).subscribe({
        next: () => {
          if (this.startProgram()) {
            this.packetCaptureService.startCapture(
              this.controller,
              this.project,
              this.link,
              captureSettings.capture_file_name
            );
          }

          // Open Web Wireshark in new tab if checkbox is selected
          if (this.openWebWireshark()) {
            this.openWebWiresharkInNewTab();
          }

          this.isLoading.set(false);
          this.dialogRef.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(`Failed to start Web Wireshark: ${err.message || 'Unknown error'}`);
        },
      });
    } else {
      // Normal capture without Web Wireshark - fast response
      if (this.startProgram()) {
        this.packetCaptureService.startCapture(
          this.controller,
          this.project,
          this.link,
          captureSettings.capture_file_name
        );
      }

      this.linkService.startCaptureOnLink(this.controller, this.link, captureSettings).subscribe(() => {
        this.dialogRef.close();
      });
    }
  }

  onNoClick() {
    this.dialogRef.close();
  }

  /**
   * Open Web Wireshark in a new browser tab
   * Connects to the WebSocket stream via xpra-html5 client
   */
  private openWebWiresharkInNewTab() {
    // Determine protocol
    const ssl = this.controller.protocol === 'https:';

    // Build xpra-html5 URL with parameters
    // xpra-html5 connects directly using server:port:path and token as password
    const params = new URLSearchParams({
      server: this.controller.host,
      port: this.controller.port.toString(),
      ssl: ssl.toString(),
      path: `/v3/projects/${this.link.project_id}/links/${this.link.link_id}/capture/web-wireshark`,
      token: this.controller.authToken,
    });

    const xpraUrl = `/assets/xpra-html5/index.html?${params.toString()}`;

    // Open in new tab
    const newWindow = window.open(xpraUrl, '_blank');

    // Detect if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      this.toasterService.error('Popup was blocked. Please allow popups for this site.');
    }
  }
}
