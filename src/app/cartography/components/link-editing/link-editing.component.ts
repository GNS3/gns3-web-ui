import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { LinksEventSource } from '../../events/links-event-source';
import { MapLink } from '../../models/map/map-link';
import { LinksWidget } from '../../widgets/links';

@Component({
  selector: 'app-link-editing',
  templateUrl: './link-editing.component.html',
  styleUrls: ['./link-editing.component.scss'],
})
export class LinkEditingComponent implements OnInit, OnDestroy {
  private linkEditedSubscription: Subscription;
  @Input('svg') svg: SVGSVGElement;

  constructor(
    private linksWidget: LinksWidget,
    private linksEventSource: LinksEventSource  ) {}

  ngOnInit() {
    const svg = select(this.svg);
    this.linkEditedSubscription = this.linksEventSource.edited.subscribe((link: MapLink) => {
        this.linksWidget.redrawLink(svg, link);
    });
  }

  ngOnDestroy() {
    this.linkEditedSubscription.unsubscribe();
  }
}
