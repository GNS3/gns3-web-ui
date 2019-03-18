import { Component, OnInit } from '@angular/core';
import { Server } from '../../../../models/server';
import { Link } from '../../../../models/link';
import { MatDialogRef } from '@angular/material';
import { PacketFiltersDialogComponent } from '../packet-filters/packet-filters.component';
import { LinkService } from '../../../../services/link.service';
import { CapturingSettings } from '../../../../models/capturingSettings';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
    selector: 'app-start-capture',
    templateUrl: './start-capture.component.html',
    styleUrls: ['./start-capture.component.scss']
})
export class StartCaptureDialogComponent implements OnInit {
    server: Server;
    link: Link;
    linkTypes = [];
    inputForm: FormGroup;

    constructor(
        private dialogRef: MatDialogRef<PacketFiltersDialogComponent>,
        private linkService: LinkService,
        private formBuilder: FormBuilder, 
        private toasterService: ToasterService
    ) {
        this.inputForm = this.formBuilder.group({
            linkType: new FormControl('', Validators.required),
            fileName: new FormControl('', Validators.required)
        });
    }

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
        if (this.inputForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            let captureSettings: CapturingSettings = {
                capture_file_name: this.inputForm.get('fileName').value,
                data_link_type: this.inputForm.get('linkType').value
            };

            this.linkService.startCaptureOnLink(this.server, this.link, captureSettings).subscribe(() => {
                this.dialogRef.close();
            });
        }
    }

    onNoClick() {
        this.dialogRef.close();
    }
}
