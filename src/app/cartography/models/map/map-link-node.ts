import { Indexed } from '../../datasources/map-datasource';
import { MapLabel } from './map-label';

export class MapLinkNode implements Indexed {
  id: string;
  nodeId: string;
  linkId: string;
  adapterNumber: number;
  portNumber: number;
  label: MapLabel;
}
