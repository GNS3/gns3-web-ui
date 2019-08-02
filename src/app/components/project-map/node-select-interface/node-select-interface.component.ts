import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Node } from '../../../cartography/models/node';
import { Port } from '../../../models/port';
import { Link } from '../../../models/link';
import { LinkNode } from '../../../models/link-node';

@Component({
  selector: 'app-node-select-interface',
  templateUrl: './node-select-interface.component.html',
  styleUrls: ['./node-select-interface.component.scss']
})
export class NodeSelectInterfaceComponent implements OnInit {
  @Input() links: Link[];
  @Output() onChooseInterface = new EventEmitter<any>();

  @ViewChild(MatMenuTrigger, {static: false}) contextMenu: MatMenuTrigger;

  protected topPosition;
  protected leftPosition;
  public node: Node;
  public availablePorts: Port[];

  constructor(
    private sanitizer: DomSanitizer, 
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setPosition(0, 0);
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + 'px');
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + 'px');
    this.changeDetector.detectChanges();
  }

  public open(node: Node, top: number, left: number) {
    this.node = node;
    this.filterNodePorts();
    this.setPosition(top, left);
    this.contextMenu.openMenu();
  }

  public filterNodePorts() {
    let linkNodes: LinkNode[] = [];
    this.links.forEach((link: Link) => {
      link.nodes.forEach((linkNode: LinkNode) => {
        if(linkNode.node_id === this.node.node_id) {
          linkNodes.push(linkNode);
        }
      });
    });

    this.availablePorts = [];
    this.node.ports.forEach((port: Port) => {
      if(linkNodes.filter((linkNode: LinkNode) => linkNode.port_number === port.port_number).length === 0){
        this.availablePorts.push(port);
      }
    });
  }

  public chooseInterface(port: Port) {
    this.onChooseInterface.emit({
      node: this.node,
      port: port
    });
  }
}
