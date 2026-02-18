import { MapLink } from '../../../../models/map/map-link';

export interface LinkStrategy {
  d(link: MapLink): string;
}
