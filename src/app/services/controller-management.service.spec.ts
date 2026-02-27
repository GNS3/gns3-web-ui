import { TestBed } from '@angular/core/testing';
import { Controller } from '@models/controller';
import { ControllerManagementService } from './controller-management.service';

describe('ControllerManagementService', () => {
  let service: ControllerManagementService;

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [ControllerManagementService],
    })
  );

  beforeEach(() => {
    service = TestBed.get(ControllerManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have status channel', () => {
    expect(service.statusChannel).toEqual('local-controller-status-events');
  });

  it('should throw error when trying to start local controller', async () => {
    await expectAsync(service.start({ name: 'test' } as Controller)).toBeRejectedWithError(
      'Local controller management is not supported in web-only mode. Please use the GNS3 CLI or traditional GNS3 GUI for local controller management.'
    );
  });

  it('should throw error when trying to stop local controller', async () => {
    await expectAsync(service.stop({ name: 'test' } as Controller)).toBeRejectedWithError(
      'Local controller management is not supported in web-only mode. Please use the GNS3 CLI or traditional GNS3 GUI for local controller management.'
    );
  });

  it('should throw error when trying to stop all local controllers', async () => {
    await expectAsync(service.stopAll()).toBeRejectedWithError(
      'Local controller management is not supported in web-only mode. Please use the GNS3 CLI or traditional GNS3 GUI for local controller management.'
    );
  });

  it('should return empty array for running controllers', () => {
    const runningControllers = service.getRunningControllers();
    expect(runningControllers).toEqual([]);
  });

  it('should cleanup on destroy', () => {
    expect(() => service.ngOnDestroy()).not.toThrow();
  });
});
