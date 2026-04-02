import { describe, it, expect } from 'vitest';
import { TemplateListDialogComponent, TemplateDatabase, TemplateDataSource, NodeAddedEvent } from './template-list-dialog.component';

describe('TemplateListDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have compareControllers method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).compareControllers).toBe('function');
    });

    it('should have filterTemplates method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).filterTemplates).toBe('function');
    });

    it('should have chooseTemplate method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).chooseTemplate).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (TemplateListDialogComponent.prototype as any).onAddClick).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export NodeAddedEvent interface', () => {
      const event: NodeAddedEvent = {
        template: {} as any,
        controller: 'local',
        numberOfNodes: 1,
        x: 0,
        y: 0,
      };
      expect(event.template).toBeDefined();
      expect(event.controller).toBe('local');
      expect(event.numberOfNodes).toBe(1);
    });

    it('should have TemplateDatabase class', () => {
      expect(typeof TemplateDatabase).toBe('function');
    });

    it('should have TemplateDataSource class', () => {
      expect(typeof TemplateDataSource).toBe('function');
    });
  });
});

describe('TemplateDataSource', () => {
  describe('prototype methods', () => {
    it('should have connect method', () => {
      expect(typeof (TemplateDataSource.prototype as any).connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(typeof (TemplateDataSource.prototype as any).disconnect).toBe('function');
    });

    it('should have filter getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(TemplateDataSource.prototype, 'filter')?.get).toBe('function');
    });

    it('should have filter setter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(TemplateDataSource.prototype, 'filter')?.set).toBe('function');
    });
  });
});

describe('TemplateDatabase', () => {
  describe('prototype', () => {
    it('should have data getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(TemplateDatabase.prototype, 'data')?.get).toBe('function');
    });
  });
});
