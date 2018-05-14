import { Selectable } from "../managers/selection-manager";

export class InterfaceLabel implements Selectable {
  constructor(
    public link_id: string,
    public direction: string,
    public x: number,
    public y: number,
    public text: string,
    public style: string,
    public rotation = 0,
    public is_selected = false
    ) {}
}
