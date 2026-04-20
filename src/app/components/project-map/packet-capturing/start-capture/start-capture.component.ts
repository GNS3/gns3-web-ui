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
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
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

  // Loading states
  readonly isLoading = signal(false);
  readonly loadingMessage = signal('');
  readonly errorMessage = signal('');

  private dialogRef = inject(MatDialogRef<PacketFiltersDialogComponent>);
  private linkService = inject(LinkService);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private nodesDataSource = inject(NodesDataSource);
  private linksDataSource = inject(LinksDataSource);
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

    // Auto-select the first option in the dropdown
    if (this.linkTypes.length > 0) {
      this.inputForm.controls['linkType'].setValue(this.linkTypes[0][1]);
    }

    const sourceNode = this.nodesDataSource.get(this.link.nodes[0].node_id);
    const targetNode = this.nodesDataSource.get(this.link.nodes[1].node_id);

    // Use interface label text instead of port name for correct display
    const sourceInterfaceLabel = this.link.nodes[0].label.text;
    const targetInterfaceLabel = this.link.nodes[1].label.text;

    // Generate filename with proper character replacement (方案3)
    // 1. Replace spaces with underscores
    // 2. Replace slashes with hyphens (Linux doesn't allow / in filenames)
    // 3. Remove other special characters except alphanumeric, underscore, and hyphen
    const fileName = `${sourceNode.name}_${sourceInterfaceLabel}_to_${targetNode.name}_${targetInterfaceLabel}`
      .replace(/\s+/g, '_')
      .replace(/[/\\]/g, '-')
      .replace(/[^0-9A-Za-z_-]/g, '');

    this.inputForm.controls['fileName'].setValue(fileName);
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
        next: (updatedLink: Link) => {
          // Update the link in the data source with the response from server
          this.linksDataSource.update(updatedLink);
          if (this.startProgram()) {
            this.packetCaptureService.startCapture(
              this.controller,
              this.project,
              this.link,
              captureSettings.capture_file_name
            );
          }
          this.isLoading.set(false);
          this.dialogRef.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          // Provide user-friendly error messages based on HTTP status code
          if (err.status === 409) {
            // Use backend error message for 409 conflicts
            const backendMessage = err.error?.message || err.error?.detail || err.message;
            this.errorMessage.set(backendMessage || 'A packet capture is already running on this link. Please stop the existing capture first.');
          } else if (err.status === 404) {
            this.errorMessage.set(
              'The link or controller could not be found. Please refresh the page and try again.'
            );
          } else if (err.status === 403) {
            this.errorMessage.set(
              'You do not have permission to start packet capture on this link.'
            );
          } else {
            this.errorMessage.set(
              `Failed to start Web Wireshark: ${err.message || 'Unknown error'}`
            );
          }
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

      this.linkService.startCaptureOnLink(this.controller, this.link, captureSettings).subscribe((updatedLink: Link) => {
        // Update the link in the data source with the response from server
        this.linksDataSource.update(updatedLink);
        this.dialogRef.close();
      });
    }
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
