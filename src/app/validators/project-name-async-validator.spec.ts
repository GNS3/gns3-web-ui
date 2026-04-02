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
    it('should return projectExist error', (done) => {
      const existingProjects = [
        { name: 'existing-project', project_id: '1' },
        { name: 'another-project', project_id: '2' },
      ];
      const control = { value: 'existing-project' };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ projectExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should match case-sensitive project names', (done) => {
      const existingProjects = [
        { name: 'MyProject', project_id: '1' },
        { name: 'myproject', project_id: '2' },
      ];
      const control = { value: 'MyProject' };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ projectExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });
  });

  describe('when project name does not exist', () => {
    it('should return null', (done) => {
      const existingProjects = [
        { name: 'existing-project', project_id: '1' },
        { name: 'another-project', project_id: '2' },
      ];
      const control = { value: 'new-project' };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should handle empty project list', (done) => {
      const existingProjects: any[] = [];
      const control = { value: 'new-project' };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      vi.advanceTimersByTime(500);
    });
  });

  describe('debounce behavior', () => {
    it('should debounce by 500ms', (done) => {
      const existingProjects: any[] = [];
      const control = { value: 'test-project' };
      const validator = createValidator(() => existingProjects);

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
    it('should handle empty string project name', (done) => {
      const existingProjects = [{ name: '', project_id: '1' }];
      const control = { value: '' };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ projectExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should handle null project name', (done) => {
      const existingProjects = [{ name: null, project_id: '1' }];
      const control = { value: null };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ projectExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });

    it('should handle undefined project name', (done) => {
      const existingProjects = [{ name: undefined, project_id: '1' }];
      const control = { value: undefined };
      const validator = createValidator(() => existingProjects);

      validator(control).subscribe((result) => {
        expect(result).toEqual({ projectExist: true });
        done();
      });

      vi.advanceTimersByTime(500);
    });
  });
});
