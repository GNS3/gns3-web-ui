import { path } from 'd3-path';
import {
    EVE_BEZIER_CURVINESS_DEFAULT,
    EVE_BEZIER_CURVINESS_MAX,
    EVE_BEZIER_CURVINESS_MIN,
    EVE_BEZIER_CURVINESS_STEP,
    EVE_FLOWCHART_ROUNDNESS_DEFAULT,
    EVE_FLOWCHART_ROUNDNESS_MAX,
    EVE_FLOWCHART_ROUNDNESS_MIN,
    EVE_FLOWCHART_ROUNDNESS_STEP,
    EVE_STATE_MACHINE_CURVINESS_DEFAULT,
    EVE_STATE_MACHINE_CURVINESS_MAX,
    EVE_STATE_MACHINE_CURVINESS_MIN,
    EVE_STATE_MACHINE_CURVINESS_STEP,
} from '@models/link-style-constants';
import { LinkStyle } from '@models/link-style';

export type ConnectorLinkType = 'straight' | 'bezier' | 'flowchart' | 'statemachine';
export type ConnectorOrientation = [number, number];
export type LinkPathOptions = {
    bezierVariation?: number;
    sourceOrientation?: ConnectorOrientation;
    targetOrientation?: ConnectorOrientation;
    flowchartDistance?: number;
};

export class StyleTranslator {
  static getLinkStyle(linkStyle: LinkStyle) {
    if (linkStyle.type == 1) {
      return `10, 10`;
    }
    if (linkStyle.type == 2) {
      return `${linkStyle.width}, ${linkStyle.width}`;
    }
    if (linkStyle.type == 3) {
      return `20, 10, ${linkStyle.width}, ${linkStyle.width}, ${linkStyle.width}, 10`;
    }
    return `0, 0`;
  }
}
