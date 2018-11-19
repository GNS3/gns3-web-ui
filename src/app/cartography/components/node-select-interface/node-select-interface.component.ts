import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from "@angular/material";
import { DomSanitizer } from "@angular/platform-browser";
import { MapNode } from '../../models/map/map-node';
import { MapPort } from '../../models/map/map-port';


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

  public node: MapNode;

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

  public open(node: MapNode, top: number, left: number) {
    this.node = node;
    this.setPosition(top, left);
    this.contextMenu.openMenu();
  }

  public chooseInterface(port: MapPort) {
    this.onChooseInterface.emit({
      'node': this.node,
      'port': port
    });
  }
}
