import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy} from '@angular/core';
import {MatMenuTrigger} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";
import {Node} from "../../../cartography/models/node";
import {Port} from "../../../models/port";


@Component({
  selector: 'app-node-select-interface',
  templateUrl: './node-select-interface.component.html',
  styleUrls: ['./node-select-interface.component.scss']
})
export class NodeSelectInterfaceComponent implements OnInit {
  @Output() onChooseInterface = new EventEmitter<any>();

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  protected topPosition;
  protected leftPosition;

  public node: Node;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    ) {}

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

  public chooseInterface(port: Port) {
    this.onChooseInterface.emit({
      'node': this.node,
      'port': port
    });
  }
}
