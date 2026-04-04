import { DrawingElement } from './drawing-element';

export type CurveType = 'basis' | 'catmullrom' | 'monotone';
export type ArrowDirection = 'none' | 'start' | 'end' | 'both';

export class CurveElement implements DrawingElement {
  height: number;
  width: number;
  stroke: string;
  stroke_width: number;
  stroke_dasharray: string;
  points: { x: number; y: number }[];
  curve_type: CurveType;
  arrow_start: boolean;
  arrow_end: boolean;
}
