import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  EventEmitter,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LinkStrategy } from './strategies/link-strategy';
import { EthernetLinkStrategy } from './strategies/ethernet-link-strategy';
import { SerialLinkStrategy } from './strategies/serial-link-strategy';
import { MultiLinkCalculatorHelper } from '../../../helpers/multi-link-calculator-helper';
import { Node } from '../../../models/node';
import { MapLink } from '../../../models/map/map-link';

@Component({
  selector: '[app-link]',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss']
})
export class LinkComponent implements OnInit, OnDestroy {
  @Input('app-link') link: MapLink;
  @Input('node-changed') nodeChanged: EventEmitter<Node>;
  @Input('show-interface-labels') showInterfaceLabels: boolean;

  @ViewChild('path') path: ElementRef;

  private ethernetLinkStrategy = new EthernetLinkStrategy();
  private serialLinkStrategy = new SerialLinkStrategy();

  private nodeChangedSubscription: Subscription;

  constructor(private multiLinkCalculatorHelper: MultiLinkCalculatorHelper, private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.ref.detectChanges();
    // this.nodeChangedSubscription = this.nodeChanged.subscribe((node: Node) => {
    //   if (this.link.source.node_id === node.node_id || this.link.target.node_id === node.node_id) {
    //     this.ref.detectChanges();
    //   }
    // });
  }

  ngOnDestroy() {
    // this.nodeChangedSubscription.unsubscribe();
  }

  get strategy(): LinkStrategy {
    if (this.link.linkType === 'serial') {
      return this.serialLinkStrategy;
    }
    return this.ethernetLinkStrategy;
  }

  get transform() {
    const translation = this.multiLinkCalculatorHelper.linkTranslation(
      this.link.distance,
      this.link.source,
      this.link.target
    );
    return `translate (${translation.dx}, ${translation.dy})`;
  }

  get d() {
    return this.strategy.d(this.link);
  }
}
