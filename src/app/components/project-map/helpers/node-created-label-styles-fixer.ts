import { Injectable, inject } from '@angular/core';
import { FontBBoxCalculator } from '../../../cartography/helpers/font-bbox-calculator';
import { Node } from '../../../cartography/models/node';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { ThemeService } from '../../../services/theme.service';

@Injectable()
export class NodeCreatedLabelStylesFixer {
  private mapSettingsService = inject(MapSettingsService);
  private themeService = inject(ThemeService);
  MARGIN_BETWEEN_NODE_AND_LABEL = 8;

  constructor(private fontBBCalculator: FontBBoxCalculator) {}

  fix(node: Node): Node {
    const style = this.mapSettingsService.getDefaultLabelStyle();
    const hasCustomDefault = this.mapSettingsService.hasDefaultLabelStyle();
    const color = hasCustomDefault ? style.color : this.themeService.getCanvasLabelColor();
    const customColorMarker = hasCustomDefault ? '--gns3-custom-label-color: 1;' : '';
    node.label.style = `font-family: ${style.fontFamily};font-size: ${style.fontSize};font-weight: ${style.fontWeight};fill: ${color};fill-opacity: 1.0;${customColorMarker}`;
    const bb = this.fontBBCalculator.calculate(node.label.text, node.label.style);

    // center label
    node.label.x = node.width / 2 - bb.width / 2;

    // move above the node
    node.label.y = -bb.height - this.MARGIN_BETWEEN_NODE_AND_LABEL;
    return node;
  }
}
