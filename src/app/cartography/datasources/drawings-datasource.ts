import { Injectable } from '@angular/core';
import { Drawing } from '../models/drawing';
import { DataSource } from './datasource';

@Injectable()
export class DrawingsDataSource extends DataSource<Drawing> {
  protected getItemKey(drawing: Drawing) {
    return drawing.drawing_id;
  }
}
