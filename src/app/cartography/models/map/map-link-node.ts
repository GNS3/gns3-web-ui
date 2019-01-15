import { MapLabel } from './map-label';
import { Indexed } from '../../datasources/map-datasource';

export class MapLinkNode implements Indexed {
  id: string;
  nodeId: string;
  linkId: string;
  adapterNumber: number;
  portNumber: number;
  label: MapLabel;
}
