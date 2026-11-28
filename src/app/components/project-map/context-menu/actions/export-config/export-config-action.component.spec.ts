import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { configurationExportFileName, StartupConfigurationsService } from '@services/startup-configurations.service';
import { ToasterService } from '@services/toaster.service';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Node } from '../../../../../cartography/models/node';
import { captureDownloads } from '../../../configuration-editor.testing';
import { ExportConfigActionComponent } from './export-config-action.component';

const controller = { id: 1 } as Controller;
const nodeFor = (node_type: string, driver?: string) =>
  ({
    node_id: 'node-1',
    project_id: 'project-1',
    node_type,
    name: 'Router-1',
    status: 'started',
    netmiko_device_type: driver,
    default_username: 'admin',
    default_password: 'saved-password',
  }) as Node;

describe('Direct configuration export', () => {
  let fixture: ComponentFixture<ExportConfigActionComponent>;
  let service: any;
  let toaster: any;
  let dialog: any;
  let nodes: any;
  let downloads: ReturnType<typeof captureDownloads>;

  beforeEach(async () => {
    service = { exportConfiguration: vi.fn(() => of(new Blob(['hostname R1\nend\n']))) };
    toaster = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn(() => ({ afterClosed: () => of('startup-config') })) };
    nodes = {
      getStartupConfiguration: vi.fn(() => of('hostname Saved\n')),
      getPrivateConfiguration: vi.fn(() => of('private\n')),
    };
    downloads = captureDownloads();
    await TestBed.configureTestingModule({
      imports: [ExportConfigActionComponent],
      providers: [
        { provide: StartupConfigurationsService, useValue: service },
        { provide: ToasterService, useValue: toaster },
        { provide: MatDialog, useValue: dialog },
        { provide: NodeService, useValue: nodes },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ExportConfigActionComponent);
    fixture.componentRef.setInput('controller', controller);
  });
  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it.each([
    ['qemu', 'cisco_ios', { device_type: 'cisco_ios_telnet' }],
    ['qemu', 'cisco_nxos_telnet', { device_type: 'cisco_nxos' }],
    ['docker', undefined, {}],
    ['vpcs', undefined, {}],
  ])('exports %s using saved settings without any dialog', (type, driver, options) => {
    const node = nodeFor(type as string, driver as string);
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(service.exportConfiguration).toHaveBeenCalledWith(controller, node, options);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it.each([
    ['iou', 'startup-config', 'getStartupConfiguration', 'Router-1_startup.cfg'],
    ['dynamips', 'private-config', 'getPrivateConfiguration', 'Router-1_private.cfg'],
  ])('downloads the chosen saved file of a %s router, started or not', (type, choice, method, filename) => {
    dialog.open.mockReturnValue({ afterClosed: () => of(choice) });
    const node = nodeFor(type);
    fixture.componentRef.setInput('node', node);
    fixture.componentInstance.exportConfig();
    expect(nodes[method]).toHaveBeenCalledWith(controller, node);
    expect(service.exportConfiguration).not.toHaveBeenCalled();
    expect(downloads.names).toEqual([filename]);
  });

  it('downloads nothing when the file choice is cancelled', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });
    fixture.componentRef.setInput('node', nodeFor('iou'));
    fixture.componentInstance.exportConfig();
    expect(nodes.getStartupConfiguration).not.toHaveBeenCalled();
    expect(downloads.blobs).toEqual([]);
  });

  it.each(['iou', 'dynamips'])('reads the running configuration of a started %s router on request', (type) => {
    const node = nodeFor(type);
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('running', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Export running config');
    fixture.nativeElement.querySelector('button').click();
    expect(service.exportConfiguration).toHaveBeenCalledWith(controller, node, {
      source: 'running',
      device_type: 'cisco_ios_telnet',
    });
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'linux', 'unsupported_os'])(
    'explains missing QEMU metadata without asking for credentials (%s)',
    (driver) => {
      fixture.componentRef.setInput('node', nodeFor('qemu', driver));
      fixture.componentInstance.exportConfig();
      expect(service.exportConfiguration).not.toHaveBeenCalled();
      expect(toaster.error).toHaveBeenCalledWith(expect.stringContaining('General settings'));
      expect(dialog.open).not.toHaveBeenCalled();
    },
  );

  it('passes the returned blob and its filename to the download helper', () => {
    const archive = new Blob(['zip'], { type: 'application/zip' });
    const node = nodeFor('docker');
    service.exportConfiguration.mockReturnValue(of(archive));
    fixture.componentRef.setInput('node', node);
    fixture.componentInstance.exportConfig();
    expect(downloads.blobs).toEqual([archive]);
    expect(downloads.names).toEqual([configurationExportFileName(node, {}, archive)]);
  });

  it('prevents duplicate exports and releases the busy state on completion', () => {
    const pending = new Subject<Blob>();
    service.exportConfiguration.mockReturnValue(pending);
    fixture.componentRef.setInput('node', nodeFor('qemu', 'cisco_ios'));
    fixture.componentInstance.exportConfig();
    fixture.componentInstance.exportConfig();
    expect(service.exportConfiguration).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.exportInProgress).toBe(true);
    pending.next(new Blob(['config']));
    pending.complete();
    expect(fixture.componentInstance.exportInProgress).toBe(false);
  });

  it('releases a stalled export after 45 seconds', async () => {
    service.exportConfiguration.mockReturnValue(new Subject());
    fixture.componentRef.setInput('node', nodeFor('qemu', 'cisco_ios'));
    fixture.componentInstance.exportConfig();
    await vi.advanceTimersByTimeAsync(45000);
    expect(fixture.componentInstance.exportInProgress).toBe(false);
    expect(toaster.error).toHaveBeenCalledWith(expect.stringContaining('45 seconds'));
    expect(downloads.blobs).toEqual([]);
  });

  it.each(['json', 'blob', 'wrapped blob'])(
    'reports export errors from %s responses without opening a dialog',
    async (format) => {
      const body = { message: 'console_authentication_failed' };
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      Object.defineProperty(blob, 'text', { value: async () => JSON.stringify(body) });
      const response = { error: format === 'json' ? body : blob };
      service.exportConfiguration.mockReturnValue(
        throwError(() => (format === 'wrapped blob' ? { originalError: response } : response)),
      );
      fixture.componentRef.setInput('node', nodeFor('qemu', 'cisco_ios'));
      fixture.componentInstance.exportConfig();
      await vi.runAllTimersAsync();
      expect(toaster.error).toHaveBeenCalledWith(expect.stringContaining('saved default username and password'));
      expect(dialog.open).not.toHaveBeenCalled();
      expect(fixture.componentInstance.exportInProgress).toBe(false);
    },
  );

  it('asks to enter privileged mode when the device needs its enable secret', () => {
    service.exportConfiguration.mockReturnValue(
      throwError(() => ({ error: { message: 'console_enable_secret_required' } })),
    );
    fixture.componentRef.setInput('node', nodeFor('qemu', 'cisco_asa'));
    fixture.componentInstance.exportConfig();
    expect(toaster.error).toHaveBeenCalledWith(expect.stringContaining('Enter privileged mode'));
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('does not request Netmiko credentials for a Docker file-export error', () => {
    service.exportConfiguration.mockReturnValue(
      throwError(() => ({ error: { message: 'invalid_configuration_request' } })),
    );
    fixture.componentRef.setInput('node', nodeFor('docker'));
    fixture.componentInstance.exportConfig();
    expect(toaster.error).toHaveBeenCalledWith(expect.stringContaining('saved-file export request'));
  });

  describe('menu visibility', () => {
    it('hides the button for ethernet_switch nodes and when there is no node', () => {
      fixture.componentRef.setInput('node', nodeFor('ethernet_switch'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      fixture.componentInstance.exportConfig();
      expect(service.exportConfiguration).not.toHaveBeenCalled();
      fixture.componentRef.setInput('node', undefined);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });
    it('shows a busy label and disables the button while exporting', () => {
      service.exportConfiguration.mockReturnValue(new Subject());
      fixture.componentRef.setInput('node', nodeFor('vpcs'));
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.textContent).toContain('Exporting config');
      expect(button.disabled).toBe(true);
    });
  });
});
