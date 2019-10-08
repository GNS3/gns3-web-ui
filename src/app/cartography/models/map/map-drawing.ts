import { DrawingElement } from '../drawings/drawing-element';
import { Indexed } from '../../datasources/map-datasource';

export class MapDrawing implements Indexed {
  id: string;
  projectId: string;
  rotation: number;
  svg: string;
  locked: boolean;
  x: number;
  y: number;
  z: number;
  element: DrawingElement; // @todo; apply converters
}
