import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  inject,
  input,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MultiLinkCalculatorHelper } from '../../../helpers/multi-link-calculator-helper';
import { MapLink } from '../../../models/map/map-link';
import { Node } from '../../../models/node';
import { EthernetLinkStrategy } from './strategies/ethernet-link-strategy';
import { LinkStrategy } from './strategies/link-strategy';
import { SerialLinkStrategy } from './strategies/serial-link-strategy';
import { StatusComponent } from '../status/status.component';

@Component({
  standalone: true,
  selector: '[app-link]',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
  imports: [StatusComponent],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class LinkComponent implements OnInit, OnDestroy {
  @Input('app-link') link: MapLink;
  readonly nodeChanged = input<EventEmitter<Node>>(undefined, { alias: 'node-changed' });
  readonly showInterfaceLabels = input<boolean>(undefined, { alias: 'show-interface-labels' });

  readonly path = viewChild<ElementRef>('path');

  private ethernetLinkStrategy = new EthernetLinkStrategy();
  private serialLinkStrategy = new SerialLinkStrategy();

  private nodeChangedSubscription: Subscription;

  private multiLinkCalculatorHelper = inject(MultiLinkCalculatorHelper);
  private ref = inject(ChangeDetectorRef);

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
    if (this.link && this.link != undefined && this.link.linkType === 'serial') {
      return this.serialLinkStrategy;
    }
    return this.ethernetLinkStrategy;
  }

  get transform() {
    if (this.link) {
      const translation = this.multiLinkCalculatorHelper.linkTranslation(
        this.link.distance,
        this.link.source,
        this.link.target
      );
      return `translate (${translation.dx}, ${translation.dy})`;
    }
  }

  get d() {
    return this.strategy.d(this.link);
  }
}
