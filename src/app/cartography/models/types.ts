import { BaseType, Selection } from 'd3-selection';

export type SVGSelection = Selection<SVGElement, any, BaseType, any>;

export interface Dictionary<T> {
  [Key: string]: T;
}
