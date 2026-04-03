import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NodeCreatedLabelStylesFixer } from './node-created-label-styles-fixer';
import { FontBBoxCalculator } from '../../../cartography/helpers/font-bbox-calculator';
import { ThemeService } from '../../../services/theme.service';
import { Node } from '../../../cartography/models/node';
import { Label } from '../../../cartography/models/label';

describe('NodeCreatedLabelStylesFixer', () => {
  let service: NodeCreatedLabelStylesFixer;
  let mockFontBBoxCalculator: { calculate: ReturnType<typeof vi.fn> };
  let mockThemeService: { getCanvasLabelColor: ReturnType<typeof vi.fn> };

  const createMockLabel = (): Label => ({
    rotation: 0,
    style: '',
    text: 'Test Node',
    x: 0,
    y: 0,
  });

  const createMockNode = (label: Label, width = 100, height = 50): Node =>
    ({
      command_line: '',
      compute_id: 'local',
      console: 3000,
      console_auto_start: false,
      console_host: '127.0.0.1',
      console_type: 'telnet',
      first_port_name: 'Ethernet0',
      height,
      label,
      locked: false,
      name: 'Test Node',
      node_directory: '',
      node_id: 'node-123',
      node_type: 'vpcs',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 1,
      ports: [],
      project_id: 'project-123',
      properties: {} as any,
      status: 'started',
      symbol: 'computer',
      symbol_url: '',
      width,
      x: 100,
      y: 100,
      z: 0,
    });

  beforeEach(() => {
    vi.clearAllMocks();

    mockFontBBoxCalculator = {
      calculate: vi.fn().mockReturnValue({ width: 50, height: 20 }),
    };

    mockThemeService = {
      getCanvasLabelColor: vi.fn().mockReturnValue('#FFFFFF'),
    };

    TestBed.configureTestingModule({
      providers: [
        NodeCreatedLabelStylesFixer,
        { provide: FontBBoxCalculator, useValue: mockFontBBoxCalculator },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    });

    service = TestBed.inject(NodeCreatedLabelStylesFixer);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of NodeCreatedLabelStylesFixer', () => {
      expect(service).toBeInstanceOf(NodeCreatedLabelStylesFixer);
    });
  });

  describe('MARGIN_BETWEEN_NODE_AND_LABEL', () => {
    it('should have margin of 8 pixels', () => {
      expect(service.MARGIN_BETWEEN_NODE_AND_LABEL).toBe(8);
    });
  });

  describe('fix', () => {
    it('should get canvas label color from theme service', () => {
      const label = createMockLabel();
      const node = createMockNode(label);

      service.fix(node);

      expect(mockThemeService.getCanvasLabelColor).toHaveBeenCalled();
    });

    it('should set label style with correct font properties', () => {
      const label = createMockLabel();
      const node = createMockNode(label);

      const result = service.fix(node);

      expect(result.label.style).toContain('font-family: TypeWriter');
      expect(result.label.style).toContain('font-size: 10.0');
      expect(result.label.style).toContain('font-weight: bold');
      expect(result.label.style).toContain('fill: #FFFFFF');
      expect(result.label.style).toContain('fill-opacity: 1.0');
    });

    it('should calculate bounding box with label text and style', () => {
      const label = createMockLabel();
      const node = createMockNode(label);

      service.fix(node);

      expect(mockFontBBoxCalculator.calculate).toHaveBeenCalledWith(
        label.text,
        label.style,
      );
    });

    it('should center label horizontally based on node width and bounding box width', () => {
      const label = createMockLabel();
      const nodeWidth = 200;
      const node = createMockNode(label, nodeWidth);

      const result = service.fix(node);

      // Center: nodeWidth/2 - bbWidth/2 = 200/2 - 50/2 = 100 - 25 = 75
      expect(result.label.x).toBe(nodeWidth / 2 - 50 / 2);
    });

    it('should position label above the node', () => {
      const label = createMockLabel();
      const node = createMockNode(label);

      const result = service.fix(node);

      // y = -bbHeight - MARGIN = -20 - 8 = -28
      expect(result.label.y).toBe(-20 - service.MARGIN_BETWEEN_NODE_AND_LABEL);
    });

    it('should return the modified node', () => {
      const label = createMockLabel();
      const node = createMockNode(label);

      const result = service.fix(node);

      expect(result).toBe(node);
    });

    it('should handle different label colors from theme service', () => {
      const label = createMockLabel();
      const node = createMockNode(label);

      mockThemeService.getCanvasLabelColor.mockReturnValue('#FF0000');
      const resultRed = service.fix(node);
      expect(resultRed.label.style).toContain('fill: #FF0000');

      mockThemeService.getCanvasLabelColor.mockReturnValue('#0000FF');
      const resultBlue = service.fix(node);
      expect(resultBlue.label.style).toContain('fill: #0000FF');
    });

    it('should use correct label text for bounding box calculation', () => {
      const label = createMockLabel();
      label.text = 'Custom Node Label';
      const node = createMockNode(label);

      service.fix(node);

      expect(mockFontBBoxCalculator.calculate).toHaveBeenCalledWith(
        'Custom Node Label',
        expect.any(String),
      );
    });
  });
});
