import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { LinksEventSource } from '../../events/links-event-source';
import { MapLink } from '../../models/map/map-link';
import { LinksWidget } from '../../widgets/links';

@Component({
  standalone: true,
  selector: 'app-link-editing',
  templateUrl: './link-editing.component.html',
  styleUrls: ['./link-editing.component.scss'],
  imports: [],
})
export class LinkEditingComponent implements OnInit, OnDestroy {
  private linkEditedSubscription: Subscription;
  readonly svg = input<SVGSVGElement>(undefined);

  private linksWidget = inject(LinksWidget);
  private linksEventSource = inject(LinksEventSource);

  ngOnInit() {
    const svg = select(this.svg());
    this.linkEditedSubscription = this.linksEventSource.edited.subscribe((link: MapLink) => {
      this.linksWidget.redrawLink(svg, link);
    });
  }

  ngOnDestroy() {
    this.linkEditedSubscription.unsubscribe();
  }
}
