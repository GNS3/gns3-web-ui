import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, inject, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { Node } from '../../../cartography/models/node';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Port } from '@models/port';

@Component({
  standalone: true,
  selector: 'app-node-select-interface',
  templateUrl: './node-select-interface.component.html',
  styleUrls: ['./node-select-interface.component.scss'],
  imports: [CommonModule, MatMenuModule],
})
export class NodeSelectInterfaceComponent implements OnInit {
  readonly links = input<Link[]>(undefined);
  @Output() onChooseInterface = new EventEmitter<any>();

  readonly contextMenu = viewChild(MatMenuTrigger);

  private sanitizer = inject(DomSanitizer);
  private changeDetector = inject(ChangeDetectorRef);

  protected topPosition;
  protected leftPosition;
  public node: Node;
  public ports: Port[];

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
    this.contextMenu().openMenu();
  }

  public filterNodePorts() {
    let linkNodes: LinkNode[] = [];
    this.links().forEach((link: Link) => {
      link.nodes.forEach((linkNode: LinkNode) => {
        if (linkNode.node_id === this.node.node_id) {
          linkNodes.push(linkNode);
        }
      });
    });

    this.ports = [];
    this.node.ports.forEach((port: Port) => {
      let linkNodesOnTheSameAdapter = linkNodes.filter(
        (linkNode: LinkNode) => linkNode.adapter_number === port.adapter_number
      );
      if (linkNodesOnTheSameAdapter.length === 0) {
        port.available = true;
      } else {
        if (
          linkNodesOnTheSameAdapter.filter((linkNode: LinkNode) => linkNode.port_number === port.port_number).length ===
          0
        ) {
          port.available = true;
        } else {
          port.available = false;
        }
      }

      this.ports.push(port);
    });
  }

  public chooseInterface(port: Port) {
    this.onChooseInterface.emit({
      node: this.node,
      port: port,
    });
  }
}
