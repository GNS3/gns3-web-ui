import { Component, OnInit } from '@angular/core';
import { Server } from '../../../../models/server';
import { Link } from '../../../../models/link';
import { MatDialogRef } from '@angular/material';
import { PacketFiltersDialogComponent } from '../packet-filters/packet-filters.component';
import { LinkService } from '../../../../services/link.service';
import { CapturingSettings } from '../../../../models/capturingSettings';

@Component({
    selector: 'app-start-capture',
    templateUrl: './start-capture.component.html',
    styleUrls: ['./start-capture.component.scss']
})
export class StartCaptureDialogComponent implements OnInit {
    server: Server;
    link: Link;
    linkTypes = [];
    
    linkType: string;
    fileName: string;

    constructor(
        private dialogRef: MatDialogRef<PacketFiltersDialogComponent>,
        private linkService: LinkService
    ) {}

    ngOnInit() {
        if (this.link.link_type === 'ethernet') {
            this.linkTypes = [
                ["Ethernet", "DLT_EN10MB"]
            ];
        } else {
            this.linkTypes = [
                ["Cisco HDLC", "DLT_C_HDLC"],
                ["Cisco PPP", "DLT_PPP_SERIAL"],
                ["Frame Relay", "DLT_FRELAY"],
                ["ATM", "DLT_ATM_RFC1483"]
            ];
        }
    }

    onYesClick() {
        let captureSettings: CapturingSettings = {
            capture_file_name: this.fileName,
            data_link_type: this.linkType
        };

        this.linkService.startCaptureOnLink(this.server, this.link, captureSettings).subscribe(() => {
            this.dialogRef.close();
        });
    }

    onNoClick() {
        this.dialogRef.close();
    }
}
