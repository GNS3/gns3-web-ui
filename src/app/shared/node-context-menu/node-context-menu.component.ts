import {ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatMenuTrigger} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";
import {Node} from "../../cartography/shared/models/node.model";


@Component({
  selector: 'app-node-context-menu',
  templateUrl: './node-context-menu.component.html',
  styleUrls: ['./node-context-menu.component.scss']
})
export class NodeContextMenuComponent implements OnInit {
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  private topPosition;
  private leftPosition;
  private node: Node;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.setPosition(0, 0);
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + "px");
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + "px");
    this.changeDetector.detectChanges();
  }

  public open(node: Node, top: number, left: number) {
    this.node = node;
    this.setPosition(top, left);
    this.contextMenu.openMenu();
  }

}
