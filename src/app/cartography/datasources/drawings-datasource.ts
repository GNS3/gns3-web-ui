import { Injectable } from "@angular/core";

import { DataSource } from "./datasource";
import { Drawing } from "../models/drawing";


@Injectable()
export class DrawingsDataSource extends DataSource<Drawing> {
  protected getItemKey(drawing: Drawing) {
    return drawing.drawing_id;
  }
}
