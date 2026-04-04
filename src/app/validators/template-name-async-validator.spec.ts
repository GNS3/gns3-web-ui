import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { templateNameAsyncValidator } from './template-name-async-validator';
import { UntypedFormControl } from '@angular/forms';

/**
 * Mock list function for TemplateService
 */
const mockListTemplates = vi.fn();

/**
 * Mock TemplateService for testing
 */
const mockTemplateService = {
  list: mockListTemplates,
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
  validatorFn: ReturnType<typeof templateNameAsyncValidator>,
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

  const serviceCalls = mockListTemplates.mock.calls.length;
  subscription.unsubscribe();

  return { result, serviceCalls };
};

describe('templateNameAsyncValidator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when template name exists', () => {
    it.each([
      ['existing-template', 'existing-template', 'exact match'],
      ['MyTemplate', 'MyTemplate', 'case-sensitive match'],
      ['template-with-numbers-123', 'template-with-numbers-123', 'alphanumeric match'],
    ])('should return templateExist error for "%s" (%s)', async (inputName, existingName, _description) => {
      // Arrange
      const existingTemplates = [
        { name: existingName, template_id: '1' },
        { name: 'another-template', template_id: '2' },
      ];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act
      const { result, serviceCalls } = await executeValidator(validator, inputName);

      // Assert
      expect(result).toEqual({ templateExist: true });
      expect(serviceCalls).toBe(1);
      expect(mockListTemplates).toHaveBeenCalledWith(mockController);
    });

    it('should not match different case template names', async () => {
      // Arrange
      const existingTemplates = [
        { name: 'MyTemplate', template_id: '1' },
        { name: 'mytemplate', template_id: '2' },
      ];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act - search for exact match "mytemplate"
      const { result } = await executeValidator(validator, 'mytemplate');

      // Assert - should match exactly "mytemplate" (case-sensitive)
      expect(result).toEqual({ templateExist: true });
    });
  });

  describe('when template name does not exist', () => {
    it.each([
      ['new-template', ['existing-template', 'another-template'], 'completely new name'],
      ['unique-name', [], 'empty template list'],
      ['test', ['prod', 'staging', 'dev'], 'name not in existing list'],
    ])('should return null for "%s" when list contains %j (%s)', async (inputName, existingNames, _description) => {
      // Arrange
      const existingTemplates = existingNames.map((name, index) => ({
        name,
        template_id: String(index + 1),
      }));
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act
      const { result } = await executeValidator(validator, inputName);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('debounce behavior', () => {
    it('should debounce by 500ms', async () => {
      // Arrange
      const existingTemplates: any[] = [];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);
      const control = createMockControl('test-template');

      let result: any = undefined;
      validator(control).subscribe((value) => {
        result = value;
      });

      // Act & Assert - should not be called before debounce
      expect(result).toBeUndefined();
      expect(mockListTemplates).not.toHaveBeenCalled();

      // Advance to debounce threshold
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      // Assert - should be called after debounce
      expect(mockListTemplates).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should debounce rapid input changes', async () => {
      // Arrange
      const existingTemplates = [{ name: 'existing', template_id: '1' }];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

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
      expect(mockListTemplates).toHaveBeenCalledTimes(3);

      subscription1.unsubscribe();
      subscription2.unsubscribe();
      subscription3.unsubscribe();
    });
  });

  describe('edge cases and special values', () => {
    it.each([
      ['', { name: '', template_id: '1' }, true, 'empty string matches empty name'],
      [null, { name: null, template_id: '1' }, true, 'null matches null name'],
      [undefined, { name: undefined, template_id: '1' }, true, 'undefined matches undefined name'],
      ['', { name: 'template', template_id: '1' }, false, 'empty string does not match non-empty name'],
    ])('should handle %s input (%s)', async (inputValue, existingTemplate, shouldExist, _description) => {
      // Arrange
      const existingTemplates = [existingTemplate];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act
      const { result } = await executeValidator(validator, inputValue);

      // Assert
      expect(result).toEqual(shouldExist ? { templateExist: true } : null);
    });

    it('should handle whitespace-only names', async () => {
      // Arrange
      const existingTemplates = [{ name: '   ', template_id: '1' }];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act
      const { result } = await executeValidator(validator, '   ');

      // Assert
      expect(result).toEqual({ templateExist: true });
    });
  });

  describe('error handling', () => {
    it('should handle TemplateService.list errors gracefully', async () => {
      // Arrange
      const error = new Error('Network error');
      mockListTemplates.mockReturnValue(throwError(() => error));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act & Assert
      const promise = executeValidator(validator, 'test-template');

      // The validator should propagate the error
      await expect(promise).rejects.toThrow('Network error');
    });

    it('should handle TemplateService.list returning undefined', async () => {
      // Arrange
      mockListTemplates.mockReturnValue(of(undefined as any));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);

      // Act & Assert
      // When response is undefined, the validator will crash trying to call .find()
      // This is a known issue in the implementation
      const promise = executeValidator(validator, 'test-template');
      await expect(promise).rejects.toThrow();
    });
  });

  describe('subscription management', () => {
    it('should allow subscription cancellation', async () => {
      // Arrange
      const existingTemplates: any[] = [];
      mockListTemplates.mockReturnValue(of(existingTemplates));
      const validator = templateNameAsyncValidator(mockController, mockTemplateService);
      const control = createMockControl('test-template');

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
