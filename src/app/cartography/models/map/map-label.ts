import { Indexed } from "../../datasources/map-datasource";

export class MapLabel implements Indexed {
  id: string;
  rotation: number;
  style: string;
  text: string;
  x: number;
  y: number;
  nodeId: string;
}
