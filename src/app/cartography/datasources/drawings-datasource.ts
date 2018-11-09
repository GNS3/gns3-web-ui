import { Injectable } from "@angular/core";

import { DataSource } from "./datasource";
import { Drawing } from "../models/drawing";


@Injectable()
export class DrawingsDataSource extends DataSource<Drawing> {
  protected findIndex(drawing: Drawing) {
    return this.data.findIndex((d: Drawing) => d.drawing_id === drawing.drawing_id);
  }
}
