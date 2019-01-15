import { TestBed, inject } from '@angular/core/testing';

import { ProgressService, State } from './progress.service';

describe('ProgressService', () => {
  let progressService: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProgressService]
    });

    progressService = TestBed.get(ProgressService);

    spyOn(progressService.state, 'next');
  });

  it('should be created', () => {
    expect(progressService).toBeTruthy();
  });

  it('should propagate event when activated', () => {
    progressService.activate();
    expect(progressService.state.next).toHaveBeenCalledWith(new State(true));
  });

  it('should propagate event when deactivated', () => {
    progressService.deactivate();
    expect(progressService.state.next).toHaveBeenCalledWith(new State(false));
  });

  it('should propagate event on error', () => {
    const error = new Error();
    progressService.setError(error);
    expect(progressService.state.next).toHaveBeenCalledWith(new State(false, error));
  });

  it('should clear an error', () => {
    progressService.clear();
    expect(progressService.state.next).toHaveBeenCalledWith(new State(false, null, true));
  });
});
