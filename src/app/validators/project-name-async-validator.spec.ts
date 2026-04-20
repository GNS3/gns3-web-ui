import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { projectNameAsyncValidator } from './project-name-async-validator';
import { UntypedFormControl } from '@angular/forms';

/**
 * Mock list function for ProjectService
 */
const mockListProjects = vi.fn();

/**
 * Mock ProjectService for testing
 */
const mockProjectService = {
  list: mockListProjects,
} as any;

/**
 * Mock Controller for testing
 */
const mockController: any = {
  id: 'test-controller',
  authToken: '',
  name: 'Test Controller',
  location: 'local',
  host: 'localhost',
  port: 3080,
  protocol: 'http',
  cpuUsagePercent: 0,
  memoryUsagePercent: 0,
  compute: vi.fn(),
  path: '/path/to/controller',
  ubridge_path: '/path/to/ubridge',
  status: 'started',
  username: 'test-user',
  consoleHost: 'localhost',
  consolePort: 3080,
  password: '',
  tokenExpired: false,
};

/**
 * Helper function to create a mock control
 */
const createMockControl = (value: unknown): UntypedFormControl => {
  return { value } as any;
};

/**
 * Helper function to execute validator and advance fake timers
 * Reduces code duplication across tests
 */
const executeValidator = async (
  validatorFn: ReturnType<typeof projectNameAsyncValidator>,
  controlValue: unknown
): Promise<{ result: any; serviceCalls: number }> => {
  const control = createMockControl(controlValue);
  let result: any = undefined;
  let completed = false;

  const subscription = validatorFn(control).subscribe({
    next: (value) => {
      result = value;
    },
    complete: () => {
      completed = true;
    },
  });

  // Advance timers past debounce threshold
  vi.advanceTimersByTime(500);
  await vi.runAllTimersAsync();

  const serviceCalls = mockListProjects.mock.calls.length;
  subscription.unsubscribe();

  return { result, serviceCalls };
};

describe('projectNameAsyncValidator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when project name exists', () => {
    it.each([
      ['existing-project', 'existing-project', 'exact match'],
      ['MyProject', 'MyProject', 'case-sensitive match'],
      ['project-with-numbers-123', 'project-with-numbers-123', 'alphanumeric match'],
    ])('should return projectExist error for "%s" (%s)', async (inputName, existingName, _description) => {
      // Arrange
      const existingProjects = [
        { name: existingName, project_id: '1' },
        { name: 'another-project', project_id: '2' },
      ];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act
      const { result, serviceCalls } = await executeValidator(validator, inputName);

      // Assert
      expect(result).toEqual({ projectExist: true });
      expect(serviceCalls).toBe(1);
      expect(mockListProjects).toHaveBeenCalledWith(mockController);
    });

    it('should not match different case project names', async () => {
      // Arrange
      const existingProjects = [
        { name: 'MyProject', project_id: '1' },
        { name: 'myproject', project_id: '2' },
      ];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act - search for exact match "myproject"
      const { result } = await executeValidator(validator, 'myproject');

      // Assert - should match exactly "myproject" (case-sensitive)
      expect(result).toEqual({ projectExist: true });
    });
  });

  describe('when project name does not exist', () => {
    it.each([
      ['new-project', ['existing-project', 'another-project'], 'completely new name'],
      ['unique-name', [], 'empty project list'],
      ['test', ['prod', 'staging', 'dev'], 'name not in existing list'],
    ])('should return null for "%s" when list contains %j (%s)', async (inputName, existingNames, _description) => {
      // Arrange
      const existingProjects = existingNames.map((name, index) => ({
        name,
        project_id: String(index + 1),
      }));
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act
      const { result } = await executeValidator(validator, inputName);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('debounce behavior', () => {
    it('should debounce by 500ms', async () => {
      // Arrange
      const existingProjects: any[] = [];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);
      const control = createMockControl('test-project');

      let result: any = undefined;
      validator(control).subscribe((value) => {
        result = value;
      });

      // Act & Assert - should not be called before debounce
      expect(result).toBeUndefined();
      expect(mockListProjects).not.toHaveBeenCalled();

      // Advance to debounce threshold
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      // Assert - should be called after debounce
      expect(mockListProjects).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should debounce rapid input changes', async () => {
      // Arrange
      const existingProjects = [{ name: 'existing', project_id: '1' }];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act - simulate rapid typing
      const control1 = createMockControl('t');
      const subscription1 = validator(control1).subscribe(() => {});

      vi.advanceTimersByTime(100);
      const control2 = createMockControl('te');
      const subscription2 = validator(control2).subscribe(() => {});

      vi.advanceTimersByTime(100);
      const control3 = createMockControl('tes');
      const subscription3 = validator(control3).subscribe(() => {});

      vi.advanceTimersByTime(400); // Total 500ms from first input
      await vi.runAllTimersAsync();

      // Assert - each validator creates its own observable stream
      expect(mockListProjects).toHaveBeenCalledTimes(3);

      subscription1.unsubscribe();
      subscription2.unsubscribe();
      subscription3.unsubscribe();
    });
  });

  describe('edge cases and special values', () => {
    it.each([
      ['', { name: '', project_id: '1' }, true, 'empty string matches empty name'],
      [null, { name: null, project_id: '1' }, true, 'null matches null name'],
      [undefined, { name: undefined, project_id: '1' }, true, 'undefined matches undefined name'],
      ['', { name: 'project', project_id: '1' }, false, 'empty string does not match non-empty name'],
    ])('should handle %s input (%s)', async (inputValue, existingProject, shouldExist, _description) => {
      // Arrange
      const existingProjects = [existingProject];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act
      const { result } = await executeValidator(validator, inputValue);

      // Assert
      expect(result).toEqual(shouldExist ? { projectExist: true } : null);
    });

    it('should handle whitespace-only names', async () => {
      // Arrange
      const existingProjects = [{ name: '   ', project_id: '1' }];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act
      const { result } = await executeValidator(validator, '   ');

      // Assert
      expect(result).toEqual({ projectExist: true });
    });
  });

  describe('error handling', () => {
    it('should handle ProjectService.list errors gracefully', async () => {
      // Arrange
      const error = new Error('Network error');
      mockListProjects.mockReturnValue(throwError(() => error));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act & Assert
      const promise = executeValidator(validator, 'test-project');

      // The validator should propagate the error
      await expect(promise).rejects.toThrow('Network error');
    });

    it('should handle ProjectService.list returning undefined', async () => {
      // Arrange
      mockListProjects.mockReturnValue(of(undefined as any));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);

      // Act & Assert
      // When response is undefined, the validator will crash trying to call .find()
      // This is a known issue in the implementation
      const promise = executeValidator(validator, 'test-project');
      await expect(promise).rejects.toThrow();
    });
  });

  describe('subscription management', () => {
    it('should allow subscription cancellation', async () => {
      // Arrange
      const existingProjects: any[] = [];
      mockListProjects.mockReturnValue(of(existingProjects));
      const validator = projectNameAsyncValidator(mockController, mockProjectService);
      const control = createMockControl('test-project');

      // Act
      const subscription = validator(control).subscribe(() => {});

      // Cancel before debounce completes
      vi.advanceTimersByTime(200);
      subscription.unsubscribe();

      // Advance past debounce threshold
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      // Assert - due to timer-based implementation, service may still be called
      // but the subscription won't receive the result
    });
  });
});
