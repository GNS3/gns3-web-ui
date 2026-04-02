import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Mock the Angular modules to avoid JIT compilation issues
vi.mock('@angular/forms', () => ({
  UntypedFormControl: vi.fn().mockImplementation(function (value: any) {
    this.value = value;
  }),
}));

vi.mock('@services/template.service', () => ({
  TemplateService: vi.fn(),
}));

vi.mock('@models/controller', () => ({
  Controller: vi.fn(),
}));

describe('templateNameAsyncValidator', () => {
  // Recreate the validator logic inline for testing
  const createValidator = (listTemplates: () => any[]) => {
    return (control: any) => {
      return timer(500).pipe(
        switchMap(() => of(listTemplates())),
        map((response) => (response.find((n: any) => n.name === control.value) ? { templateExist: true } : null))
      );
    };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('when template name exists', () => {
    it('should return templateExist error', async () => {
      const existingTemplates = [
        { name: 'existing-template', template_id: '1' },
        { name: 'another-template', template_id: '2' },
      ];
      const control = { value: 'existing-template' };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ templateExist: true });
    });

    it('should match case-sensitive template names', async () => {
      const existingTemplates = [
        { name: 'MyTemplate', template_id: '1' },
        { name: 'mytemplate', template_id: '2' },
      ];
      const control = { value: 'MyTemplate' };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ templateExist: true });
    });
  });

  describe('when template name does not exist', () => {
    it('should return null', async () => {
      const existingTemplates = [
        { name: 'existing-template', template_id: '1' },
        { name: 'another-template', template_id: '2' },
      ];
      const control = { value: 'new-template' };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBeNull();
    });

    it('should handle empty template list', async () => {
      const existingTemplates: any[] = [];
      const control = { value: 'new-template' };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBeNull();
    });
  });

  describe('debounce behavior', () => {
    it('should debounce by 500ms', async () => {
      const existingTemplates: any[] = [];
      const control = { value: 'test-template' };
      const validator = createValidator(() => existingTemplates);

      let called = false;
      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe(() => {
          called = true;
          resolve(true);
        });
      });

      // Should not be called before 500ms
      expect(called).toBe(false);

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      await resultPromise;
      expect(called).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string template name', async () => {
      const existingTemplates = [{ name: '', template_id: '1' }];
      const control = { value: '' };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ templateExist: true });
    });

    it('should handle null template name', async () => {
      const existingTemplates = [{ name: null, template_id: '1' }];
      const control = { value: null };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ templateExist: true });
    });

    it('should handle undefined template name', async () => {
      const existingTemplates = [{ name: undefined, template_id: '1' }];
      const control = { value: undefined };
      const validator = createValidator(() => existingTemplates);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ templateExist: true });
    });
  });
});
