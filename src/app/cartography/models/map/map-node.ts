import { Indexed } from '../../datasources/map-datasource';
import { MapLabel } from './map-label';
import { MapPort } from './map-port';
import { Properties } from '../node';

export class MapNode implements Indexed {
  id: string;
  commandLine: string;
  computeId: string;
  console: number;
  consoleHost: string;
  consoleType: string;
  firstPortName: string;
  height: number;
  label: MapLabel;
  locked: boolean;
  name: string;
  nodeDirectory: string;
  nodeType: string;
  portNameFormat: string;
  portSegmentSize: number;
  ports: MapPort[];
  properties: Properties;
  projectId: string;
  status: string;
  symbol: string;
  symbolUrl: string;
  usage?: string;
  width: number;
  x: number;
  y: number;
  z: number;
}
