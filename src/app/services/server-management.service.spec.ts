import { TestBed } from '@angular/core/testing';
import { ElectronService } from 'ngx-electron';
import { Server } from '../models/server';
import { ServerManagementService } from './server-management.service';

describe('ServerManagementService', () => {
  let electronService;
  let callbacks;
  let removed;
  let controller;

  beforeEach(() => {
    callbacks = [];
    removed = [];
    controller = undefined;
    electronService = {
      isElectronApp: true,
      ipcRenderer: {
        on: (channel, callback) => {
          callbacks.push({
            channel: channel,
            callback: callback,
          });
        },
        removeAllListeners: (name) => {
          removed.push(name);
        },
      },
      remote: {
        require: (file) => {
          return {
            startLocalServer: (serv) => {
              controller = serv;
            },
            stopLocalServer: (serv) => {
              controller = serv;
            },
          };
        },
      },
    };
  });

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ServerManagementService,
        { provide: ElectronService, useValue: electronService },
      ],
    })
  );

  it('should be created', () => {
    const service: ServerManagementService = TestBed.get(ServerManagementService);
    expect(service).toBeTruthy();
  });

  it('should attach when running as electron app', () => {
    TestBed.get(ServerManagementService);
    expect(callbacks.length).toEqual(1);
    expect(callbacks[0].channel).toEqual('local-controller-status-events');
  });

  it('should not attach when running as not electron app', () => {
    electronService.isElectronApp = false;
    TestBed.get(ServerManagementService);
    expect(callbacks.length).toEqual(0);
  });

  it('should deattach when running as electron app', () => {
    const service: ServerManagementService = TestBed.get(ServerManagementService);
    service.ngOnDestroy();
    expect(removed).toEqual(['local-controller-status-events']);
  });

  it('should not deattach when running as not electron app', () => {
    electronService.isElectronApp = false;
    const service: ServerManagementService = TestBed.get(ServerManagementService);
    service.ngOnDestroy();
    expect(removed).toEqual([]);
  });

  it('should start local controller', async () => {
    const service: ServerManagementService = TestBed.get(ServerManagementService);
    await service.start({ name: 'test' } as Server);
    expect(controller).toEqual({ name: 'test' });
  });

  it('should stop local controller', async () => {
    const service: ServerManagementService = TestBed.get(ServerManagementService);
    await service.stop({ name: 'test2' } as Server);
    expect(controller).toEqual({ name: 'test2' });
  });
});
