import { describe, it, expect, beforeEach } from 'vitest';
import { ToolsService } from './tools.service';
import { firstValueFrom, Subject, filter } from 'rxjs';

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
      expect(service.isSelectionToolActivated).toBeInstanceOf(Subject);
      expect(service.isMovingToolActivated).toBeInstanceOf(Subject);
      expect(service.isTextEditingToolActivated).toBeInstanceOf(Subject);
      expect(service.isTextAddingToolActivated).toBeInstanceOf(Subject);
      expect(service.isDrawLinkToolActivated).toBeInstanceOf(Subject);
    });
  });

  describe('Selection Tool', () => {
    it('should activate selection tool when passed true', async () => {
      const resultPromise = firstValueFrom(
        service.isSelectionToolActivated.pipe(filter((v) => v === true))
      );
      service.selectionToolActivation(true);
      await expect(resultPromise).resolves.toBe(true);
    });

    it('should deactivate selection tool when passed false', async () => {
      const resultPromise = firstValueFrom(
        service.isSelectionToolActivated.pipe(filter((v) => v === false))
      );
      service.selectionToolActivation(false);
      await expect(resultPromise).resolves.toBe(false);
    });

    it('should emit multiple selection tool states in order', async () => {
      const values: boolean[] = [];
      const subscription = service.isSelectionToolActivated.subscribe((value) => {
        values.push(value);
      });

      service.selectionToolActivation(true);
      service.selectionToolActivation(false);
      service.selectionToolActivation(true);
      service.selectionToolActivation(false);

      subscription.unsubscribe();
      expect(values).toEqual([true, false, true, false]);
    });
  });

  describe('Moving Tool', () => {
    it('should activate moving tool when passed true', async () => {
      const resultPromise = firstValueFrom(
        service.isMovingToolActivated.pipe(filter((v) => v === true))
      );
      service.movingToolActivation(true);
      await expect(resultPromise).resolves.toBe(true);
    });

    it('should deactivate moving tool when passed false', async () => {
      const resultPromise = firstValueFrom(
        service.isMovingToolActivated.pipe(filter((v) => v === false))
      );
      service.movingToolActivation(false);
      await expect(resultPromise).resolves.toBe(false);
    });

    it('should emit multiple moving tool states in order', async () => {
      const values: boolean[] = [];
      const subscription = service.isMovingToolActivated.subscribe((value) => {
        values.push(value);
      });

      service.movingToolActivation(true);
      service.movingToolActivation(false);
      service.movingToolActivation(true);

      subscription.unsubscribe();
      expect(values).toEqual([true, false, true]);
    });
  });

  describe('Text Editing Tool', () => {
    it('should activate text editing tool when passed true', async () => {
      const resultPromise = firstValueFrom(
        service.isTextEditingToolActivated.pipe(filter((v) => v === true))
      );
      service.textEditingToolActivation(true);
      await expect(resultPromise).resolves.toBe(true);
    });

    it('should deactivate text editing tool when passed false', async () => {
      const resultPromise = firstValueFrom(
        service.isTextEditingToolActivated.pipe(filter((v) => v === false))
      );
      service.textEditingToolActivation(false);
      await expect(resultPromise).resolves.toBe(false);
    });
  });

  describe('Text Adding Tool', () => {
    it('should activate text adding tool when passed true', async () => {
      const resultPromise = firstValueFrom(
        service.isTextAddingToolActivated.pipe(filter((v) => v === true))
      );
      service.textAddingToolActivation(true);
      await expect(resultPromise).resolves.toBe(true);
    });

    it('should deactivate text adding tool when passed false', async () => {
      const resultPromise = firstValueFrom(
        service.isTextAddingToolActivated.pipe(filter((v) => v === false))
      );
      service.textAddingToolActivation(false);
      await expect(resultPromise).resolves.toBe(false);
    });
  });

  describe('Draw Link Tool', () => {
    it('should activate draw link tool when passed true', async () => {
      const resultPromise = firstValueFrom(
        service.isDrawLinkToolActivated.pipe(filter((v) => v === true))
      );
      service.drawLinkToolActivation(true);
      await expect(resultPromise).resolves.toBe(true);
    });

    it('should deactivate draw link tool when passed false', async () => {
      const resultPromise = firstValueFrom(
        service.isDrawLinkToolActivated.pipe(filter((v) => v === false))
      );
      service.drawLinkToolActivation(false);
      await expect(resultPromise).resolves.toBe(false);
    });

    it('should toggle draw link tool state', async () => {
      const values: boolean[] = [];
      const subscription = service.isDrawLinkToolActivated.subscribe((value) => {
        values.push(value);
      });

      service.drawLinkToolActivation(true);
      service.drawLinkToolActivation(false);
      service.drawLinkToolActivation(true);
      service.drawLinkToolActivation(false);

      subscription.unsubscribe();
      expect(values).toEqual([true, false, true, false]);
    });
  });

  describe('Multiple Tools', () => {
    it('should handle multiple tool activations simultaneously', async () => {
      let selectionCount = 0;
      let movingCount = 0;
      let drawLinkCount = 0;

      const sub1 = service.isSelectionToolActivated.subscribe(() => selectionCount++);
      const sub2 = service.isMovingToolActivated.subscribe(() => movingCount++);
      const sub3 = service.isDrawLinkToolActivated.subscribe(() => drawLinkCount++);

      service.selectionToolActivation(true);
      service.movingToolActivation(true);
      service.drawLinkToolActivation(true);

      expect(selectionCount).toBe(1);
      expect(movingCount).toBe(1);
      expect(drawLinkCount).toBe(1);

      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid activation changes', async () => {
      const values: boolean[] = [];
      const subscription = service.isSelectionToolActivated.subscribe((value) => {
        values.push(value);
      });

      for (let i = 0; i < 10; i++) {
        service.selectionToolActivation(i % 2 === 0);
      }

      expect(values.length).toBe(10);
      expect(values[values.length - 1]).toBe(false);

      subscription.unsubscribe();
    });

    it('should pass through undefined boolean conversion', async () => {
      const resultPromise = firstValueFrom(
        service.isSelectionToolActivated.pipe(filter((v) => v === undefined))
      );
      service.selectionToolActivation(undefined as unknown as boolean);
      await expect(resultPromise).resolves.toBeUndefined();
    });

    it('should pass through null boolean conversion', async () => {
      const resultPromise = firstValueFrom(
        service.isSelectionToolActivated.pipe(filter((v) => v === null))
      );
      service.selectionToolActivation(null as unknown as boolean);
      await expect(resultPromise).resolves.toBeNull();
    });

    it('should handle string conversion to boolean', async () => {
      const values: (string | boolean | null | undefined)[] = [];
      const subscription = service.isSelectionToolActivated.subscribe((value) => {
        values.push(value);
      });

      service.selectionToolActivation('truthy' as unknown as boolean);
      service.selectionToolActivation('' as unknown as boolean);

      subscription.unsubscribe();
      expect(values).toEqual(['truthy', '']);
    });
  });
});
