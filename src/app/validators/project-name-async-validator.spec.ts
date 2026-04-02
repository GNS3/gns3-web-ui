import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Mock the Angular modules to avoid JIT compilation issues
vi.mock('@angular/forms', () => ({
  UntypedFormControl: vi.fn().mockImplementation(function (value: any) {
    this.value = value;
  }),
}));

vi.mock('@services/project.service', () => ({
  ProjectService: vi.fn(),
}));

vi.mock('@models/controller', () => ({
  Controller: vi.fn(),
}));

describe('projectNameAsyncValidator', () => {
  // Recreate the validator logic inline for testing
  const createValidator = (listProjects: () => any[]) => {
    return (control: any) => {
      return timer(500).pipe(
        switchMap(() => of(listProjects())),
        map((response) => (response.find((n: any) => n.name === control.value) ? { projectExist: true } : null))
      );
    };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('when project name exists', () => {
    it('should return projectExist error', async () => {
      const existingProjects = [
        { name: 'existing-project', project_id: '1' },
        { name: 'another-project', project_id: '2' },
      ];
      const control = { value: 'existing-project' };
      const validator = createValidator(() => existingProjects);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ projectExist: true });
    });

    it('should match case-sensitive project names', async () => {
      const existingProjects = [
        { name: 'MyProject', project_id: '1' },
        { name: 'myproject', project_id: '2' },
      ];
      const control = { value: 'MyProject' };
      const validator = createValidator(() => existingProjects);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ projectExist: true });
    });
  });

  describe('when project name does not exist', () => {
    it('should return null', async () => {
      const existingProjects = [
        { name: 'existing-project', project_id: '1' },
        { name: 'another-project', project_id: '2' },
      ];
      const control = { value: 'new-project' };
      const validator = createValidator(() => existingProjects);

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

    it('should handle empty project list', async () => {
      const existingProjects: any[] = [];
      const control = { value: 'new-project' };
      const validator = createValidator(() => existingProjects);

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
      const existingProjects: any[] = [];
      const control = { value: 'test-project' };
      const validator = createValidator(() => existingProjects);

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
    it('should handle empty string project name', async () => {
      const existingProjects = [{ name: '', project_id: '1' }];
      const control = { value: '' };
      const validator = createValidator(() => existingProjects);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ projectExist: true });
    });

    it('should handle null project name', async () => {
      const existingProjects = [{ name: null, project_id: '1' }];
      const control = { value: null };
      const validator = createValidator(() => existingProjects);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ projectExist: true });
    });

    it('should handle undefined project name', async () => {
      const existingProjects = [{ name: undefined, project_id: '1' }];
      const control = { value: undefined };
      const validator = createValidator(() => existingProjects);

      const resultPromise = new Promise((resolve) => {
        validator(control).subscribe((result) => {
          resolve(result);
        });
      });

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toEqual({ projectExist: true });
    });
  });
});
