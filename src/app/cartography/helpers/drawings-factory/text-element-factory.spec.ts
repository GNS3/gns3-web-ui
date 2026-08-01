import { describe, expect, it, vi } from 'vitest';
import { MapSettingsService } from '@services/mapsettings.service';
import { TextElement } from '../../models/drawings/text-element';
import { TextElementFactory } from './text-element-factory';

describe('TextElementFactory', () => {
  it('should apply the configured default note style', () => {
    const mapSettingsService = {
      getDefaultNoteStyle: vi.fn().mockReturnValue({
        fontFamily: 'Verdana',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#123456',
      }),
    } as unknown as MapSettingsService;
    const factory = new TextElementFactory(mapSettingsService);

    const element = factory.getDrawingElement() as TextElement;

    expect(element.font_family).toBe('Verdana');
    expect(element.font_size).toBe(14);
    expect(element.font_weight).toBe('normal');
    expect(element.fill).toBe('#123456');
  });

  it('should preserve the established note dimensions', () => {
    const mapSettingsService = {
      getDefaultNoteStyle: vi.fn().mockReturnValue({
        fontFamily: 'Noto Sans',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#000000',
      }),
    } as unknown as MapSettingsService;
    const factory = new TextElementFactory(mapSettingsService);

    const element = factory.getDrawingElement() as TextElement;

    expect(element.width).toBe(100);
    expect(element.height).toBe(100);
  });
});
