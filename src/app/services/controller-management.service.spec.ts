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
    service = TestBed.inject(ControllerManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start local controller', async () => {
    await service.start({ name: 'test' } as Controller);
    expect(service.getRunningControllers()).toEqual([]);
  });

  it('should stop local controller', async () => {
    await service.stop({ name: 'test2' } as Controller);
    expect(service.getRunningControllers()).toEqual([]);
  });

  it('should stop all controllers', async () => {
    await service.stopAll();
    expect(service.getRunningControllers()).toEqual([]);
  });

  it('should return empty running controllers', () => {
    expect(service.getRunningControllers()).toEqual([]);
  });
});
