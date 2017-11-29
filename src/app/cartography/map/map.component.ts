import {
  ChangeDetectorRef,
  Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChange,
  ViewChild
} from '@angular/core';
import { D3, D3Service } from 'd3-ng2-service';
import { Selection } from 'd3-selection';

import { Node } from "../shared/models/node.model";
import { Link } from "../shared/models/link.model";
import { GraphLayout } from "../shared/widgets/graph.widget";
import { Context } from "../../map/models/context";
import { Size } from "../shared/models/size.model";
import { Drawing } from "../shared/models/drawing.model";
import {MatMenuTrigger} from "@angular/material";
import {NodeOnContextMenuListener} from "../shared/widgets/nodes.widget";
import {DomSanitizer} from "@angular/platform-browser";

class NodeOnContextMenu implements NodeOnContextMenuListener {
  constructor(private component: MapComponent) {}

  onContextMenu() {
    this.component.contextMenu.openMenu();
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() nodes: Node[] = [];
  @Input() links: Link[] = [];
  @Input() drawings: Drawing[] = [];
  @Input() width = 1500;
  @Input() height = 600;
  @Input() windowFullSize = true;

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  private d3: D3;
  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;

  private graphLayout: GraphLayout;
  private graphContext: Context;

  public contextMenuTop;
  public contextMenuLeft;

  constructor(protected element: ElementRef,
              protected d3Service: D3Service,
              protected sanitizer: DomSanitizer,
              protected changeDetector: ChangeDetectorRef
              ) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;

    this.contextMenuLeft = this.sanitizer.bypassSecurityTrustStyle("0");
    this.contextMenuTop = this.sanitizer.bypassSecurityTrustStyle("0");
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (
      (changes['width'] && !changes['width'].isFirstChange()) ||
      (changes['height'] && !changes['height'].isFirstChange()) ||
      (changes['drawings'] && !changes['drawings'].isFirstChange()) ||
      (changes['nodes'] && !changes['nodes'].isFirstChange()) ||
      (changes['links'] && !changes['links'].isFirstChange())
    ) {
      if (this.svg.empty && !this.svg.empty()) {
        if (changes['nodes']) {
          this.onNodesChange(changes['nodes']);
        }
        if (changes['links']) {
          this.onLinksChange(changes['links']);
        }
        this.changeLayout();
      }
    }
  }

  ngOnDestroy() {
    if (this.svg.empty && !this.svg.empty()) {
      this.svg.selectAll('*').remove();
    }
  }

  ngOnInit() {
    const d3 = this.d3;

    let rootElement: Selection<HTMLElement, any, null, undefined>;

    const self = this;

    if (this.parentNativeElement !== null) {
      rootElement = d3.select(this.parentNativeElement);

      this.svg = rootElement.select<SVGSVGElement>('svg');

      this.graphContext = new Context(this.svg);

      if (this.windowFullSize) {
        this.graphContext.setSize(this.getSize());
      } else {
        this.graphContext.setSize(new Size(this.width, this.height));
      }

      this.graphLayout = new GraphLayout();
      this.graphLayout.draw(this.svg, this.graphContext);
      // this.graphLayout.getNodesWidget().setOnContextMenuListener(new NodeOnContextMenu(self));
      this.graphLayout.getNodesWidget().setOnContextMenuCallback((event: any) => {

        this.contextMenuLeft = this.sanitizer.bypassSecurityTrustStyle(event.clientX + "px");
        this.contextMenuTop = this.sanitizer.bypassSecurityTrustStyle(event.clientY + "px");
        this.changeDetector.detectChanges();

        this.contextMenu.openMenu();
      });
    }
  }

  public getSize(): Size {
    return new Size(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight);
  }

  private changeLayout() {
    if (this.graphContext != null) {
      this.svg
        .attr('width', this.graphContext.getSize().width)
        .attr('height', this.graphContext.getSize().height);
    }


    if (this.windowFullSize) {
      if (this.parentNativeElement != null) {
        this.graphContext.setSize(this.getSize());
      }

    } else {

    }

    this.graphLayout.setNodes(this.nodes);
    this.graphLayout.setLinks(this.links);
    this.graphLayout.setDrawings(this.drawings);

    this.redraw();
  }

  private onLinksChange(change: SimpleChange) {
    const nodes_by_id = {};
    this.nodes.forEach((n: Node) => {
      nodes_by_id[n.node_id] = n;
    });

    this.links.forEach((link: Link) => {
      const source_id = link.nodes[0].node_id;
      const target_id = link.nodes[1].node_id;
      if (source_id in nodes_by_id) {
        link.source = nodes_by_id[source_id];
      }
      if (target_id in nodes_by_id) {
        link.target = nodes_by_id[target_id];
      }
    });
  }

  private onNodesChange(change: SimpleChange) {
    this.onLinksChange(null);
  }

  public redraw() {
    this.graphLayout.draw(this.svg, this.graphContext);
  }

  public reload() {
    this.onLinksChange(null);
    this.redraw();
  }
}
