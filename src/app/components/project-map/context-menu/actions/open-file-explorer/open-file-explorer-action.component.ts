import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html',
})
export class OpenFileExplorerActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor(private toasterService: ToasterService) {}

  ngOnInit() {}

  open() {
    // File explorer integration is not available in web-only mode
    this.toasterService.error('File explorer integration is not available in web-only mode.');
  }
}
