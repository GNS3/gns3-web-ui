import { Indexed } from "../datasources/map-datasource";

export class InterfaceLabel implements Indexed {
  constructor(
    public id: string,
    public link_id: string,
    public direction: string,
    public x: number,
    public y: number,
    public text: string,
    public style: string,
    public rotation = 0,
    ) {}
}
