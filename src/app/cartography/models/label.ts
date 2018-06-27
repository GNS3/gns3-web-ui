import { Selectable } from "../managers/selection-manager";

export class Label implements Selectable {
  rotation: number;
  style: string;
  text: string;
  x: number;
  y: number;
  is_selected: boolean;
}
