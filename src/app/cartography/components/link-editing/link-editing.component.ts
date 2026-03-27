import { Component, OnDestroy, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { Controller } from '@models/controller';
import { Link } from '@models/link';
import { LinksEventSource } from '../../events/links-event-source';
import { MapLink } from '../../models/map/map-link';
import { LinksWidget } from '../../widgets/links';
import { LinksDataSource } from '../../datasources/links-datasource';
import { LinkService } from '@services/link.service';
import { StyleTranslator } from '../../widgets/links/style-translator';

@Component({
  selector: 'app-link-editing',
  templateUrl: './link-editing.component.html',
  styleUrl: './link-editing.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkEditingComponent implements OnInit, OnDestroy {
  private linkEditedSubscription: Subscription;
  readonly svg = input<SVGSVGElement>(undefined);
  readonly controller = input<Controller>(undefined);

  private linksWidget = inject(LinksWidget);
  private linksEventSource = inject(LinksEventSource);
  private linksDataSource = inject(LinksDataSource);
  private linkService = inject(LinkService);

  ngOnInit() {
    const svg = select(this.svg());
    const ctrl = this.controller();
    this.linkEditedSubscription = this.linksEventSource.edited.subscribe((mapLink: MapLink) => {
      this.linksWidget.redrawLink(svg, mapLink);

      // Save curviness to server if controller is available
      if (ctrl && mapLink.link_style?.bezier_curviness !== undefined) {
        const link = this.linksDataSource.get(mapLink.id) as Link;
        if (link) {
          // Clone and normalize curviness to integer before saving
          link.link_style = {
            ...mapLink.link_style,
            bezier_curviness: StyleTranslator.normalizeBezierCurviness(mapLink.link_style.bezier_curviness),
          };
          this.linkService.updateLinkStyle(ctrl, link).subscribe();
        }
      }
    });
  }

  ngOnDestroy() {
    this.linkEditedSubscription.unsubscribe();
  }
}
