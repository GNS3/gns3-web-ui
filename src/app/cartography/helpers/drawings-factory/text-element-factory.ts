import { Injectable } from '@angular/core';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { TextElement } from '../../models/drawings/text-element';
import { DrawingElementFactory } from './drawing-element-factory';
import { MapSettingsService } from '@services/mapsettings.service';

@Injectable()
export class TextElementFactory implements DrawingElementFactory {
  constructor(private mapSettingsService: MapSettingsService) {}

  getDrawingElement(): DrawingElement {
    const style = this.mapSettingsService.getDefaultNoteStyle();
    let textElement = new TextElement();
    textElement.height = 100;
    textElement.width = 100;
    textElement.fill = style.color;
    textElement.fill_opacity = 0;
    textElement.font_family = style.fontFamily;
    textElement.font_size = style.fontSize;
    textElement.font_weight = style.fontWeight;
    return textElement;
  }
}
