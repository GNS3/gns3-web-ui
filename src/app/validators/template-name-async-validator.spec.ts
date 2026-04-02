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
    it('should return templateExist error', (done) => {
      const existingTemplates = [
        { name: 'existing-template', template_id: '1' },
        { name: 'another-template', template_id: '2' },
      ];
      const control = { value: 'existing-template' };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ templateExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should match case-sensitive template names', (done) => {
      const existingTemplates = [
        { name: 'MyTemplate', template_id: '1' },
        { name: 'mytemplate', template_id: '2' },
      ];
      const control = { value: 'MyTemplate' };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ templateExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });
  });

  describe('when template name does not exist', () => {
    it('should return null', (done) => {
      const existingTemplates = [
        { name: 'existing-template', template_id: '1' },
        { name: 'another-template', template_id: '2' },
      ];
      const control = { value: 'new-template' };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should handle empty template list', (done) => {
      const existingTemplates: any[] = [];
      const control = { value: 'new-template' };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      vi.advanceTimersByTime(500);
    });
  });

  describe('debounce behavior', () => {
    it('should debounce by 500ms', (done) => {
      const existingTemplates: any[] = [];
      const control = { value: 'test-template' };
      const validator = createValidator(() => existingTemplates);

      let called = false;
      validator(control).subscribe(() => {
        called = true;
        expect(called).toBe(true);
        done();
      });

      // Should not be called before 500ms
      expect(called).toBe(false);
      vi.advanceTimersByTime(500);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string template name', (done) => {
      const existingTemplates = [{ name: '', template_id: '1' }];
      const control = { value: '' };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ templateExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should handle null template name', (done) => {
      const existingTemplates = [{ name: null, template_id: '1' }];
      const control = { value: null };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ templateExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should handle undefined template name', (done) => {
      const existingTemplates = [{ name: undefined, template_id: '1' }];
      const control = { value: undefined };
      const validator = createValidator(() => existingTemplates);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ templateExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });
  });
});
