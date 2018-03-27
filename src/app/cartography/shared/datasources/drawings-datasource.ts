import { Injectable } from "@angular/core";

import { Drawing } from "../models/drawing";
import { DataSource } from "./datasource";


@Injectable()
export class DrawingsDataSource extends DataSource<Drawing> {
  protected findIndex(drawing: Drawing) {
    return this.data.findIndex((d: Drawing) => d.drawing_id === drawing.drawing_id);
  }
}
