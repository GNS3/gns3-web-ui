import { DrawingElementFactory } from './drawing-element-factory';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { TextElement } from '../../models/drawings/text-element';
import { Injectable } from '@angular/core';

@Injectable()
export class TextElementFactory implements DrawingElementFactory {
  getDrawingElement(): DrawingElement {
    let textElement = new TextElement();
    textElement.height = 100;
    textElement.width = 100;
    textElement.fill = '#000000';
    textElement.fill_opacity = 0;
    textElement.font_family = 'Noto Sans';
    textElement.font_size = 11;
    textElement.font_weight = 'bold';
    return textElement;
  }
}
