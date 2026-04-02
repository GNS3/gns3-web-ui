import { describe, it, expect, beforeEach } from 'vitest';
import { ToolsService } from './tools.service';
import { Subject } from 'rxjs';

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(() => {
    service = new ToolsService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize all tool subjects', () => {
      expect(service.isSelectionToolActivated).toBeDefined();
      expect(service.isMovingToolActivated).toBeDefined();
      expect(service.isTextEditingToolActivated).toBeDefined();
      expect(service.isTextAddingToolActivated).toBeDefined();
      expect(service.isDrawLinkToolActivated).toBeDefined();
    });

    it('should have all subjects as instances of Subject', () => {
      expect(service.isSelectionToolActivated).toBeInstanceOf(Subject);
      expect(service.isMovingToolActivated).toBeInstanceOf(Subject);
      expect(service.isTextEditingToolActivated).toBeInstanceOf(Subject);
      expect(service.isTextAddingToolActivated).toBeInstanceOf(Subject);
      expect(service.isDrawLinkToolActivated).toBeInstanceOf(Subject);
    });
  });

  describe('Selection Tool', () => {
    it('should activate selection tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isSelectionToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.selectionToolActivation(true);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should deactivate selection tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isSelectionToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.selectionToolActivation(false);

      const result = await resultPromise;
      expect(result).toBe(false);
    });

    it('should emit multiple selection tool states', async () => {
      const values: boolean[] = [];

      const resultPromise = new Promise<void>((resolve) => {
        service.isSelectionToolActivated.subscribe((value) => {
          values.push(value);
          if (values.length === 2) {
            resolve();
          }
        });
      });

      service.selectionToolActivation(true);
      service.selectionToolActivation(false);

      await resultPromise;
      expect(values).toEqual([true, false]);
    });
  });

  describe('Moving Tool', () => {
    it('should activate moving tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isMovingToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.movingToolActivation(true);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should deactivate moving tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isMovingToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.movingToolActivation(false);

      const result = await resultPromise;
      expect(result).toBe(false);
    });

    it('should emit multiple moving tool states', async () => {
      const values: boolean[] = [];

      const resultPromise = new Promise<void>((resolve) => {
        service.isMovingToolActivated.subscribe((value) => {
          values.push(value);
          if (values.length === 3) {
            resolve();
          }
        });
      });

      service.movingToolActivation(true);
      service.movingToolActivation(false);
      service.movingToolActivation(true);

      await resultPromise;
      expect(values).toEqual([true, false, true]);
    });
  });

  describe('Text Editing Tool', () => {
    it('should activate text editing tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isTextEditingToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.textEditingToolActivation(true);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should deactivate text editing tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isTextEditingToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.textEditingToolActivation(false);

      const result = await resultPromise;
      expect(result).toBe(false);
    });
  });

  describe('Text Adding Tool', () => {
    it('should activate text adding tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isTextAddingToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.textAddingToolActivation(true);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should deactivate text adding tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isTextAddingToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.textAddingToolActivation(false);

      const result = await resultPromise;
      expect(result).toBe(false);
    });
  });

  describe('Draw Link Tool', () => {
    it('should activate draw link tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isDrawLinkToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.drawLinkToolActivation(true);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should deactivate draw link tool', async () => {
      const resultPromise = new Promise<boolean>((resolve) => {
        service.isDrawLinkToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.drawLinkToolActivation(false);

      const result = await resultPromise;
      expect(result).toBe(false);
    });

    it('should toggle draw link tool state', async () => {
      const values: boolean[] = [];

      const resultPromise = new Promise<void>((resolve) => {
        service.isDrawLinkToolActivated.subscribe((value) => {
          values.push(value);
          if (values.length === 4) {
            resolve();
          }
        });
      });

      service.drawLinkToolActivation(true);
      service.drawLinkToolActivation(false);
      service.drawLinkToolActivation(true);
      service.drawLinkToolActivation(false);

      await resultPromise;
      expect(values).toEqual([true, false, true, false]);
    });
  });

  describe('Multiple Tools', () => {
    it('should handle multiple tool activations simultaneously', async () => {
      let selectionCount = 0;
      let movingCount = 0;
      let drawLinkCount = 0;

      service.isSelectionToolActivated.subscribe(() => selectionCount++);
      service.isMovingToolActivated.subscribe(() => movingCount++);
      service.isDrawLinkToolActivated.subscribe(() => drawLinkCount++);

      service.selectionToolActivation(true);
      service.movingToolActivation(true);
      service.drawLinkToolActivation(true);

      // Wait for all subscriptions to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selectionCount).toBe(1);
      expect(movingCount).toBe(1);
      expect(drawLinkCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid activation changes', async () => {
      const values: boolean[] = [];

      service.isSelectionToolActivated.subscribe((value) => {
        values.push(value);
      });

      // Rapidly toggle 10 times
      for (let i = 0; i < 10; i++) {
        service.selectionToolActivation(i % 2 === 0);
      }

      // Wait for all emissions to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(values.length).toBe(10);
      expect(values[values.length - 1]).toBe(false);
    });

    it('should handle undefined boolean conversion', async () => {
      const resultPromise = new Promise<any>((resolve) => {
        service.isSelectionToolActivated.subscribe((value) => {
          resolve(value);
        });
      });

      service.selectionToolActivation(undefined as any);

      const result = await resultPromise;
      // Subject passes through undefined as-is
      expect(result).toBeUndefined();
    });
  });
});
