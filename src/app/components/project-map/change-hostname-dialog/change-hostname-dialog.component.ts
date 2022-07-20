import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../cartography/models/node';
import { Server } from '../../../models/server';
import { NodeService } from '../../../services/node.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-change-hostname-dialog-component',
  templateUrl: './change-hostname-dialog.component.html',
  styleUrls: ['./change-hostname-dialog.component.scss'],
})
export class ChangeHostnameDialogComponent implements OnInit {
  controller: Server;
  node: Node;
  inputForm: FormGroup;
  name: string;

  constructor(
    public dialogRef: MatDialogRef<ChangeHostnameDialogComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder
  ) {
    this.inputForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = this.node.name;
    });
  }

  onSaveClick() {
    if (this.inputForm.valid) {
      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
