import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  AfterViewInit
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { CssFixer } from '../../../helpers/css-fixer';
import { FontFixer } from '../../../helpers/font-fixer';
import { Symbol } from '../../../../models/symbol';
import { MapNode } from '../../../models/map/map-node';
import { NodesEventSource } from '../../../events/nodes-event-source';
import { DraggedDataEvent } from '../../../events/event-source';

@Component({
  selector: '[app-node]',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodeComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  static NODE_LABEL_MARGIN = 3;

  @ViewChild('label') label: ElementRef;
  @ViewChild('image') imageRef: ElementRef;

  @Input('app-node') node: MapNode;
  @Input('symbols') symbols: Symbol[];
  @Input('node-changed') nodeChanged: EventEmitter<Node>;

  // @Output() valueChange = new EventEmitter<Node>();

  nodeChangedSubscription: Subscription;

  private labelHeight = 0;

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer,
    private sanitizer: DomSanitizer,
    protected element: ElementRef,
    private cd: ChangeDetectorRef,
    private nodesEventSource: NodesEventSource
  ) {}

  ngOnInit() {
    // this.nodeChangedSubscription = this.nodeChanged.subscribe((node: Node) => {
    //   if (node.node_id === this.node.node_id) {
    //     this.cd.detectChanges();
    //   }
    // });
  }

  ngOnDestroy() {
    // this.nodeChangedSubscription.unsubscribe();
  }

  ngOnChanges(changes) {
    this.cd.detectChanges();
  }

  ngAfterViewInit() {
    this.labelHeight = this.getLabelHeight();
    // reload BBox
    this.cd.detectChanges();
  }

  OnDragging(evt) {
    this.node.x = evt.x;
    this.node.y = evt.y;
    this.cd.detectChanges();
  }

  OnDragged(evt) {
    this.cd.detectChanges();
    this.nodesEventSource.dragged.emit(new DraggedDataEvent<MapNode>(this.node, evt.dx, evt.dy));
  }

  get symbol(): string {
    const symbol = this.symbols.find((s: Symbol) => s.symbol_id === this.node.symbol);
    if (symbol) {
      return 'data:image/svg+xml;base64,' + btoa(symbol.raw);
    }
    // @todo; we need to have default image
    return 'data:image/svg+xml;base64,none';
  }

  get label_style() {
    let styles = this.cssFixer.fix(this.node.label.style);
    styles = this.fontFixer.fixStyles(styles);
    return this.sanitizer.bypassSecurityTrustStyle(styles);
  }

  get label_x(): number {
    if (this.node.label.x === null) {
      // center
      const bbox = this.label.nativeElement.getBBox();

      return -bbox.width / 2;
    }
    return this.node.label.x + NodeComponent.NODE_LABEL_MARGIN;
  }

  get label_y(): number {
    this.labelHeight = this.getLabelHeight();

    if (this.node.label.x === null) {
      // center
      return -this.node.height / 2 - this.labelHeight;
    }
    return this.node.label.y + this.labelHeight - NodeComponent.NODE_LABEL_MARGIN;
  }

  private getLabelHeight() {
    const bbox = this.label.nativeElement.getBBox();
    return bbox.height;
  }
}
