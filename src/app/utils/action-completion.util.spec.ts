import { describe, expect, it, vi } from 'vitest';
import { createActionCompletion } from './action-completion.util';

describe('createActionCompletion', () => {
  it('reports successful operations once all operations finish', () => {
    const onComplete = vi.fn();
    const completion = createActionCompletion(3, onComplete);

    completion.succeed();
    completion.fail();
    expect(onComplete).not.toHaveBeenCalled();

    completion.succeed();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(2);
  });

  it('reports zero successes when every operation failed', () => {
    const onComplete = vi.fn();
    const completion = createActionCompletion(2, onComplete);

    completion.fail();
    completion.fail();

    expect(onComplete).toHaveBeenCalledWith(0);
  });

  it('ignores completions beyond the configured operation count', () => {
    const onComplete = vi.fn();
    const completion = createActionCompletion(1, onComplete);

    completion.succeed();
    completion.succeed();

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
