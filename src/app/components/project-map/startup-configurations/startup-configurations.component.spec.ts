import {
  captureDownloads,
  noStartupMediaProfiles,
  configurationDocumentMocks,
  configurationEditorUiMocks,
  configurationJob,
  startupDocument,
  startupStatus,
} from '../configuration-editor.testing';
import { StartupMediaProfilesService } from '@services/startup-media-profiles.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NodeSymbolResolverService } from '@services/node-symbol-resolver.service';
import { ProjectService } from '@services/project.service';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import {
  ConfigurationJob,
  SetImportResult,
  STARTUP_DEFAULT_SET_ID,
  StartupDocument,
  StartupNodeStatus,
} from '@models/startup-configuration';
import { ToasterService } from '@services/toaster.service';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartupConfigurationsComponent } from './startup-configurations.component';

const setId = STARTUP_DEFAULT_SET_ID;
const nodeId = '10000000-0000-0000-0000-000000000001';
const otherId = '10000000-0000-0000-0000-000000000002';
const webtermId = '10000000-0000-0000-0000-000000000003';
const vpcsId = '10000000-0000-0000-0000-000000000004';
const initial = () => startupDocument();

function configurationMocks() {
  return {
    ...configurationDocumentMocks(initial),
    capture: vi.fn<StartupConfigurationsService['capture']>(() => of(configurationJob({ status: 'running' }))),
    status: vi.fn<StartupConfigurationsService['status']>(() => of(startupStatus())),
    importSet: vi.fn<StartupConfigurationsService['importSet']>(),
    exportSet: vi.fn<StartupConfigurationsService['exportSet']>(),
  };
}

describe('Startup configurations', () => {
  let fixture: ComponentFixture<StartupConfigurationsComponent>;
  let component: StartupConfigurationsComponent;
  let service: ReturnType<typeof configurationMocks>;
  let toast: ReturnType<typeof configurationEditorUiMocks>['toast'];
  let nameDialog: ReturnType<typeof configurationEditorUiMocks>['dialog'];
  beforeEach(async () => {
    service = configurationMocks();
    const { toast: notifications, dialog, dialogRef } = configurationEditorUiMocks();
    toast = notifications;
    nameDialog = dialog;
    await TestBed.configureTestingModule({
      imports: [StartupConfigurationsComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { controller: {}, project: { project_id: 'project' } } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: nameDialog },
        { provide: StartupConfigurationsService, useValue: service },
        { provide: StartupMediaProfilesService, useValue: noStartupMediaProfiles },
        {
          provide: ProjectService,
          useValue: {
            nodes: () =>
              of([
                {
                  node_id: nodeId,
                  name: 'ASA1',
                  status: 'started',
                  node_type: 'qemu',
                  netmiko_device_type: 'cisco_asa',
                },
                { node_id: otherId, name: 'IOS1', status: 'stopped', node_type: 'iou' },
                { node_id: webtermId, name: 'Webterm-1', status: 'stopped', node_type: 'docker' },
                { node_id: vpcsId, name: 'PC1', status: 'stopped', node_type: 'vpcs' },
                ...['cloud', 'nat', 'ethernet_switch', 'ethernet_hub'].map((node_type) => ({
                  node_id: node_type,
                  name: node_type,
                  status: 'started',
                  node_type,
                })),
              ]),
          },
        },
        { provide: ToasterService, useValue: toast },
        { provide: NodeSymbolResolverService, useValue: { resolve: vi.fn((_controller, nodes) => of(nodes)) } },
      ],
    })
      .overrideProvider(MatDialog, { useValue: nameDialog })
      .compileComponents();
    fixture = TestBed.createComponent(StartupConfigurationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });
  const answerDialog = (answer: unknown) => nameDialog.open.mockReturnValue({ afterClosed: () => of(answer) });
  const jobOf = (operation: 'capture' | 'apply', nodes: Record<string, string>, status = 'finished', id = 'job') =>
    configurationJob({ operation, nodes, status, id });
  const nodeStatus = (status: string, extra: Partial<StartupNodeStatus> = {}) =>
    startupStatus({ nodes: { [nodeId]: { set_id: setId, status, ...extra } } });
  describe('editing configurations', () => {
    it('tracks and saves edits made through the shared configuration editor', () => {
      const textarea = fixture.nativeElement.querySelector('textarea');
      textarea.value = 'hostname edited-in-editor\n';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.draft().content).toBe('hostname edited-in-editor\n');
      expect(component.dirty()).toBe(true);
      component.save();
      const saved = service.save.mock.calls[0][2];
      expect(saved.sets.find((set) => set.id === component.viewing()).nodes[component.nodeId()].content).toBe(
        'hostname edited-in-editor\n',
      );
    });

    it('uploads, saves and enables the configuration in the viewed startup set', async () => {
      component.addSet(false, 'Uploaded set');
      const viewed = component.viewing();
      const input = { files: [{ size: 24, text: async () => 'hostname UploadedNexus\n' }], value: 'config.cfg' };
      await component.upload({ target: input } as unknown as Event);
      const saved = service.save.mock.calls[0][2];
      expect(saved.selected).toBe(setId);
      expect(saved.selections[nodeId]).toEqual({ kind: 'set', set_id: viewed });
      expect(saved.sets.find((set) => set.id === viewed).nodes[nodeId]).toMatchObject({
        enabled: true,
        content: 'hostname UploadedNexus\n',
      });
      expect(component.dirty()).toBe(false);
      expect(input.value).toBe('');
    });

    it('downloads the draft under the node name with the extension of its device type', () => {
      component.draft.set({
        device_type: 'mikrotik_routeros',
        content: '/system identity set name=R1',
        enabled: false,
      });
      const save = captureDownloads();
      component.download();
      expect(save.names).toEqual(['ASA1_configuration.rsc']);
      expect(save.blobs[0].type).toBe('text/plain;charset=utf-8');
    });

    it('shows the resolved node symbol with a fallback and accessible runtime status dots', () => {
      component.nodes.update((nodes) =>
        nodes.map((node) => (node.node_id === nodeId ? { ...node, symbol_url: 'blob:asa-icon' } : node)),
      );
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('.node');
      expect(rows[0].querySelector('.node-icon img').getAttribute('src')).toBe('blob:asa-icon');
      expect(rows[0].querySelector('.node-status').getAttribute('data-status')).toBe('started');
      expect(rows[0].querySelector('.node-status').getAttribute('aria-label')).toBe('started');
      expect(rows[1].querySelector('.node-status').getAttribute('data-status')).toBe('stopped');
      expect(rows[1].querySelector('.node-icon mat-icon').textContent).toBe('dns');
      expect(rows[0].textContent).not.toContain('started');
      rows[0].querySelector('img').dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(rows[0].querySelector('.node-icon img')).toBeNull();
      expect(rows[0].querySelector('.node-icon mat-icon')).not.toBeNull();
    });

    it('reports the rejected field without exposing configuration contents', () => {
      service.save.mockReturnValue(
        throwError(() => ({
          originalError: {
            error: {
              message: 'invalid_configuration_request',
              details: {
                validation_errors: [
                  { location: ['body', 'sets', 0, 'nodes', webtermId, 'device_type'], type: 'literal_error' },
                ],
              },
            },
          },
        })),
      );
      component.selectNode(webtermId);
      component.capture();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('device_type'));
      expect(service.capture).not.toHaveBeenCalled();
    });

    it('renders the manager and infers the appliance driver', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Apply Config Set"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.node').length).toBe(4);
      expect(component.nodes().map((node) => node.node_type)).toEqual(['qemu', 'iou', 'vpcs', 'docker']);
      expect(component.draft().device_type).toBe('cisco_asa');
      expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBe(1);
    });

    it('shows a recoverable 404 error instead of remaining on Loading', () => {
      service.get.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Not Found' } })),
      );
      component.document.set(null);
      component.load();
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
        'does not support this configuration operation (404)',
      );
      expect(fixture.nativeElement.textContent).not.toContain('Loading startup configurations');
      service.status.mockClear();
      vi.advanceTimersByTime(2000);
      expect(service.status).not.toHaveBeenCalled();
      service.get.mockReturnValue(of(initial()));
      fixture.nativeElement.querySelector('[role="alert"] button').click();
      fixture.detectChanges();
      expect(component.loadError()).toBe('');
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[aria-label="Apply Config Set"]')).not.toBeNull();
    });

    it('preserves node edits when switching and saves startup activation', () => {
      component.draft.update((draft) => ({ ...draft, content: 'hostname ASA1\n' }));
      component.draft.update((draft) => ({ ...draft, enabled: true }));
      component.changed();
      component.selectNode(otherId);
      expect(component.draft().device_type).toBe('cisco_ios_telnet');
      component.selectNode(nodeId);
      expect(component.draft().content).toBe('hostname ASA1\n');
      component.save();
      const saved = service.save.mock.calls[0][2];
      expect(saved.sets[0].nodes[nodeId].enabled).toBe(true);
      expect(component.dirty()).toBe(false);
    });

    it('cancels unsaved edits by restoring saved configurations while keeping the dialog open', () => {
      const dialog = TestBed.inject(MatDialogRef);
      component.draft.update((draft) => ({ ...draft, content: 'unsaved changes' }));
      component.changed();
      fixture.detectChanges();
      const cancel = [...fixture.nativeElement.querySelectorAll('button')].find(
        (button: any) => button.textContent.trim() === 'Cancel changes',
      ) as HTMLButtonElement;
      expect(cancel.disabled).toBe(false);
      const reads = service.get.mock.calls.length;
      cancel.click();
      expect(dialog.close).not.toHaveBeenCalled();
      expect(service.save).not.toHaveBeenCalled();
      expect(service.get).toHaveBeenCalledTimes(reads + 1);
      expect(component.draft().content).toBe('');
      expect(component.dirty()).toBe(false);
    });

    it('shows Close for an unchanged document and blocks it until edits are saved or cancelled', () => {
      const close = [...fixture.nativeElement.querySelectorAll('button')].find(
        (button: any) => button.textContent.trim() === 'Close',
      ) as HTMLButtonElement;
      expect(close.disabled).toBe(false);
      expect(fixture.nativeElement.textContent).not.toContain('Cancel changes');
      component.changed();
      fixture.detectChanges();
      expect(close.disabled).toBe(true);
      component.close();
      expect(TestBed.inject(MatDialogRef).close).not.toHaveBeenCalled();
    });

    it('retries both configurations and node discovery after a node-list failure', () => {
      const projects = TestBed.inject(ProjectService);
      const nodes = component.nodes();
      projects.nodes = vi.fn(() => throwError(() => new Error('Node discovery failed')));
      component.load();
      expect(component.loadError()).toContain('Node discovery failed');
      vi.mocked(projects.nodes).mockReturnValue(of(nodes));
      component.load();
      expect(component.loadError()).toBe('');
      expect(component.nodes()).toEqual(nodes);
    });

    it('allows viewing read-only projects without saving or capturing configurations', async () => {
      fixture.destroy();
      TestBed.inject(MAT_DIALOG_DATA).project.readonly = true;
      fixture = TestBed.createComponent(StartupConfigurationsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.draft.update((draft) => ({ ...draft, content: 'hostname local edits' }));
      component.changed();
      component.save();
      component.capture();
      component.setStartupForAll(true);
      const text = vi.fn(async () => 'hostname uploaded');
      await component.upload({ target: { files: [{ size: 10, text }] } } as unknown as Event);
      expect(text).not.toHaveBeenCalled();
      expect(service.save).not.toHaveBeenCalled();
      expect(service.capture).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('textarea').readOnly).toBe(true);
      expect(fixture.nativeElement.querySelector('[aria-label="Create set"]').disabled).toBe(true);
    });

    describe('draft flushing', () => {
      it('does not create empty set entries just by clicking through nodes', () => {
        component.selectNode(otherId);
        component.selectNode(vpcsId);
        component.selectNode(nodeId);
        component.selectSet(setId);
        expect(component.currentSet().nodes).toEqual({});
      });
      it('does flush a real edit when the user moves to another node', () => {
        component.draft.update((draft) => ({ ...draft, content: 'hostname edited\n' }));
        component.changed();
        component.selectNode(otherId);
        expect(component.currentSet().nodes[nodeId].content).toBe('hostname edited\n');
      });
    });

    describe('node configuration upload paths', () => {
      const fileInput = (text: () => Promise<string>, size = 10) => ({ files: [{ size, text }], value: 'config.cfg' });

      it('stores an upload under the node recipe and enables it when the saved entry had another device type', async () => {
        component.currentSet().nodes[nodeId] = { device_type: 'cisco_nxos', content: 'old\n', enabled: false };
        component.readDraft();
        await component.upload({ target: fileInput(async () => 'hostname new\n') } as unknown as Event);
        const entry = service.save.mock.calls[0][2].sets[0].nodes[nodeId];
        expect(entry).toEqual({ device_type: 'cisco_asa', content: 'hostname new\n', enabled: true });
      });

      it('does not accept edits or uploads for a QEMU node without a device type instead of dropping them', async () => {
        component.nodes().find((node) => node.node_id === nodeId).netmiko_device_type = null;
        component.readDraft();
        component.nodes.update((nodes) => [...nodes]);
        fixture.detectChanges();
        expect(component.editBlockedHint()).toContain('Netmiko device type');
        expect(fixture.nativeElement.querySelector('textarea').readOnly).toBe(true);
        expect(fixture.nativeElement.querySelector('.upload-config').disabled).toBe(true);
        await component.upload({ target: fileInput(async () => 'hostname x\n') } as unknown as Event);
        expect(service.save).not.toHaveBeenCalled();
      });

      it('rejects a binary file client-side without saving and resets the input', async () => {
        const input = fileInput(async () => 'ab\u0000cd');
        await component.upload({ target: input } as unknown as Event);
        expect(service.save).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('binary'));
        expect(component.draft().content).toBe('');
        expect(component.busy()).toBe(false);
        expect(input.value).toBe('');
      });

      it('rolls the document, editor and dirty state back when saving the upload fails', async () => {
        component.draft.update((draft) => ({ ...draft, content: 'hostname before\n' }));
        component.changed();
        component.dirty.set(false);
        const before = structuredClone(component.document());
        service.save.mockReturnValue(throwError(() => ({ error: { message: 'startup_configurations_changed' } })));
        const input = fileInput(async () => 'hostname uploaded\n');
        await component.upload({ target: input } as unknown as Event);
        expect(component.draft().content).toBe('hostname before\n');
        expect(component.document()).toEqual(before);
        expect(component.dirty()).toBe(false);
        expect(component.busy()).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
        expect(toast.success).not.toHaveBeenCalled();
        expect(input.value).toBe('');
      });
    });
  });

  describe('startup assignments', () => {
    it('applies the viewed set and saves every eligible switch in one request', () => {
      component.addSet(false, 'Recovery');
      component.draft.update((draft) => ({ ...draft, content: 'hostname ASA1\n' }));
      component.currentSet().nodes[otherId] = {
        device_type: 'cisco_ios_telnet',
        content: 'hostname IOS1\n',
        enabled: false,
      };
      component.currentSet().nodes[vpcsId] = { device_type: 'vpcs', content: '', enabled: true };
      const selected = component.viewing();
      component.setStartupForAll(true);
      expect(service.save).toHaveBeenCalledOnce();
      const saved = service.save.mock.calls[0][2];
      expect(saved.selected).toBe(selected);
      const entries = saved.sets.find((set) => set.id === selected).nodes;
      expect(entries[nodeId].enabled).toBe(true);
      expect(entries[otherId].enabled).toBe(true);
      expect(entries[vpcsId].enabled).toBe(false);
      expect(component.draft().enabled).toBe(true);
      expect(component.dirty()).toBe(false);
    });

    it('resets startup globally while preserving configurations and other sets', () => {
      component.draft.update((draft) => ({ ...draft, content: 'hostname ASA1\n' }));
      component.draft.update((draft) => ({ ...draft, enabled: true }));
      component.changed();
      component.addSet(true, 'Recovery');
      const content = component.draft().content;
      component.setStartupForAll(false);
      expect(service.save).toHaveBeenCalledOnce();
      expect(component.document().selected).toBe(component.viewing());
      expect(Object.values(component.currentSet().nodes).every((entry) => !entry.enabled)).toBe(true);
      expect(component.draft().content).toBe(content);
      expect(component.draft().enabled).toBe(false);
      expect(component.document().sets[0].nodes[nodeId].enabled).toBe(true);
      expect(component.dirty()).toBe(false);
    });

    it('rolls back the startup set and switches if bulk application cannot be saved', () => {
      component.addSet(false, 'Recovery');
      component.draft.update((draft) => ({ ...draft, content: 'hostname ASA1\n' }));
      component.flushDraft();
      const before = structuredClone(component.document());
      service.save.mockReturnValue(throwError(() => new Error('Save failed')));
      component.setStartupForAll(true);
      expect(component.document()).toEqual(before);
      expect(component.draft().enabled).toBe(false);
      expect(component.busy()).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('shows an OFF switch for every device, requires a supported configuration to enable it, and falls back to unavailable when it is cleared', () => {
      const switches = [...fixture.nativeElement.querySelectorAll('button[role="switch"]')] as HTMLButtonElement[];
      expect(switches).toHaveLength(component.nodes().length);
      for (const toggle of switches) {
        expect(toggle.textContent).toBe('OFF');
        expect(toggle.getAttribute('aria-checked')).toBe('false');
        expect(toggle.disabled).toBe(true);
        expect(toggle.closest('button.node-select')).toBeNull();
      }
      component.draft.set({ device_type: 'cisco_asa', content: '   ', enabled: false });
      component.toggleStartup(nodeId);
      expect(service.save).not.toHaveBeenCalled();
      component.draft.set({ device_type: 'cisco_asa', content: '  \n', enabled: true });
      component.changed();
      fixture.detectChanges();
      const toggle = fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;
      expect(component.draft().enabled).toBe(false);
      expect(toggle.getAttribute('data-state')).toBe('unavailable');
      expect(toggle.getAttribute('aria-checked')).toBe('false');
      expect(toggle.disabled).toBe(true);
      expect(toggle.textContent).toBe('OFF');
    });

    it('distinguishes unavailable, saved OFF and enabled ON configurations in the node list', () => {
      component.document.update((document) => ({
        ...document,
        sets: document.sets.map((set) => ({
          ...set,
          nodes: {
            [otherId]: { device_type: 'cisco_ios_telnet', content: 'hostname IOS1', enabled: false },
            [webtermId]: { device_type: 'linux_interfaces', content: 'auto eth0', enabled: true },
          },
        })),
      }));
      fixture.detectChanges();
      const toggles = ['ASA1', 'IOS1', 'Webterm-1'].map(
        (name) =>
          fixture.nativeElement.querySelector(
            `button[role="switch"][aria-label="Apply startup configuration for ${name}"]`,
          ) as HTMLButtonElement,
      );
      const rows = toggles.map((toggle) => toggle.closest('.node') as HTMLElement);
      expect(rows.slice(0, 3).map((row) => row.getAttribute('data-startup-state'))).toEqual([
        'unavailable',
        'off',
        'on',
      ]);
      expect(toggles.slice(0, 3).map((toggle) => toggle.getAttribute('data-state'))).toEqual([
        'unavailable',
        'off',
        'on',
      ]);
      expect(toggles.slice(0, 3).map((toggle) => toggle.disabled)).toEqual([true, false, false]);
      expect(toggles.slice(0, 3).map((toggle) => toggle.textContent)).toEqual(['OFF', 'OFF', 'ON']);
      expect(toggles[0].getAttribute('aria-description')).toContain('No saved configuration');
      expect(toggles[1].title).toContain('Not using this set at startup');
      expect(toggles[2].title).toContain('Use Wipe node, then Start');
      toggles[1].click();
      fixture.detectChanges();
      expect(toggles[1].getAttribute('data-state')).toBe('on');
      expect(toggles[1].getAttribute('aria-checked')).toBe('true');
      expect(component.nodeId()).toBe(nodeId);
      expect(service.save).toHaveBeenCalledOnce();
    });

    it('refuses Viptela startup without a startup media profile and points at the profile', () => {
      component.nodes()[0].netmiko_device_type = 'cisco_viptela';
      component.draft.set({ device_type: 'cisco_viptela', content: 'system\n host-name vsmart\n!\n', enabled: false });
      fixture.detectChanges();
      expect(component.canToggleStartup(nodeId)).toBe(false);
      expect(component.startupHint(nodeId)).toBe('This configuration cannot be applied to this node type.');
    });

    it('enables Viptela startup as boot media without a Netmiko type or console and keeps it downloadable', () => {
      component.nodes()[0].properties = { startup_media_profile: 'cisco-viptela' } as any;
      component.nodes()[0].netmiko_device_type = null;
      component.nodes()[0].console_type = 'vnc';
      component.draft.set({ device_type: 'cisco_viptela', content: 'system\n host-name vsmart\n!\n', enabled: false });
      fixture.detectChanges();
      const toggle = fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;
      expect(toggle.disabled).toBe(false);
      toggle.click();
      fixture.detectChanges();
      expect(component.startupEnabled(nodeId)).toBe(true);
      expect(service.save).toHaveBeenCalled();
      const save = captureDownloads();
      component.download();
      expect(save.names).toEqual(['ASA1_configuration.cfg']);
    });

    it('toggles the current draft ON and OFF and saves each change automatically', () => {
      component.draft.update((draft) => ({ ...draft, content: 'hostname ASA1\n' }));
      component.changed();
      fixture.detectChanges();
      const toggle = fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;
      expect(toggle.disabled).toBe(false);
      expect(toggle.getAttribute('aria-label')).toContain('ASA1');
      toggle.click();
      fixture.detectChanges();
      expect(toggle.textContent).toBe('ON');
      expect(toggle.getAttribute('aria-checked')).toBe('true');
      expect(component.draft().enabled).toBe(true);
      expect(service.save.mock.calls[0][2].sets[0].nodes[nodeId]).toEqual({
        device_type: 'cisco_asa',
        content: 'hostname ASA1\n',
        enabled: true,
      });
      expect(component.dirty()).toBe(false);
      toggle.click();
      fixture.detectChanges();
      expect(toggle.textContent).toBe('OFF');
      expect(service.save).toHaveBeenCalledTimes(2);
      expect(component.draft().enabled).toBe(false);
    });

    it('toggles another device without switching the editor or losing its current draft', () => {
      component.currentSet().nodes[otherId] = {
        device_type: 'cisco_ios_telnet',
        content: 'hostname IOS1\n',
        enabled: false,
      };
      component.draft.update((draft) => ({ ...draft, content: 'hostname edited ASA\n' }));
      component.changed();
      fixture.detectChanges();
      const toggle = fixture.nativeElement.querySelectorAll('button[role="switch"]')[1] as HTMLButtonElement;
      toggle.click();
      expect(component.nodeId()).toBe(nodeId);
      expect(component.draft().content).toBe('hostname edited ASA\n');
      expect(component.currentSet().nodes[otherId].enabled).toBe(true);
      expect(component.currentSet().nodes[nodeId].content).toBe('hostname edited ASA\n');
      expect(service.save).toHaveBeenCalledOnce();
    });

    it('restores the switch and draft if saving the toggle fails', () => {
      component.draft.update((draft) => ({ ...draft, content: 'local edits' }));
      component.changed();
      service.save.mockReturnValue(throwError(() => new Error('startup_configurations_changed')));
      component.toggleStartup(nodeId);
      expect(component.startupEnabled(nodeId)).toBe(false);
      expect(component.draft().content).toBe('local edits');
      expect(component.dirty()).toBe(true);
      expect(component.busy()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
    });

    it('keeps startup choices separate between configuration sets', () => {
      component.draft.update((draft) => ({ ...draft, content: 'hostname ASA1' }));
      component.toggleStartup(nodeId);
      const original = component.viewing();
      component.addSet(false, 'Other scenario');
      expect(component.startupEnabled(nodeId)).toBe(false);
      component.selectSet(original);
      expect(component.startupEnabled(nodeId)).toBe(true);
    });

    it('explains a restore blocker and refuses to enable startup', () => {
      component.nodes()[0].console_type = 'vnc';
      component.draft.set({ device_type: 'cisco_asa', content: 'hostname ASA1\n', enabled: false });
      fixture.detectChanges();
      expect(component.canToggleStartup(nodeId)).toBe(false);
      expect(component.startupDescription(nodeId)).toContain('Telnet or SSH');
      expect(component.nodeStatus(nodeId)).toContain('Telnet or SSH');
      component.toggleStartup(nodeId);
      expect(service.save).not.toHaveBeenCalled();
    });

    it('does not enable a saved entry of another device type, nor a Docker FRR or managed-file node', () => {
      component.draft.set({ device_type: 'cisco_nxos', content: 'hostname N\n', enabled: false });
      expect(component.canToggleStartup(nodeId)).toBe(false);
      expect(component.startupDescription(nodeId)).toContain('different device type');
      const docker = component.nodes().find((node) => node.node_id === webtermId);
      docker.netmiko_device_type = 'frr';
      component.currentSet().nodes[webtermId] = {
        device_type: 'linux_interfaces',
        content: 'auto lo\n',
        enabled: false,
      };
      expect(component.canToggleStartup(webtermId)).toBe(false);
      expect(component.startupDescription(webtermId)).toContain('unsupported');
    });

    it('shows mixed startup assignments and changes only the toggled node', () => {
      const document = initial();
      const entry = { device_type: 'cisco_asa' as const, content: 'hostname ASA1\n', enabled: true };
      document.sets[0].nodes[nodeId] = { ...entry };
      document.sets[0].nodes[otherId] = { ...entry };
      document.sets.push({ id: 'other', name: 'Recovery', nodes: { [nodeId]: { ...entry } } });
      document.selections = {
        [nodeId]: { kind: 'set', set_id: 'other' },
        [otherId]: { kind: 'set', set_id: setId },
      };
      service.get.mockReturnValue(of(document));
      component.load();
      fixture.detectChanges();
      expect(component.assignedSetName(nodeId)).toBe('Recovery');
      expect(component.assignedSetName(otherId)).toBe('Default');
      expect(component.startupEnabled(nodeId)).toBe(false);
      expect(component.startupEnabled(otherId)).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Startup: Recovery');
      component.toggleStartup(nodeId);
      const saved = service.save.mock.calls[0][2];
      expect(saved.selections[nodeId]).toEqual({ kind: 'set', set_id: setId });
      expect(saved.selections[otherId]).toEqual(document.selections[otherId]);
      expect(saved.sets[1].nodes[nodeId]).toEqual(entry);
    });

    it('bulk apply replaces overrides and disables nodes without a configuration in the applied set', () => {
      const document = initial();
      document.sets[0].nodes[nodeId] = { device_type: 'cisco_asa', content: 'hostname default\n', enabled: true };
      document.sets.push({
        id: 'other',
        name: 'Other',
        nodes: {
          [otherId]: { device_type: 'cisco_ios_telnet', content: 'hostname other\n', enabled: true },
        },
      });
      document.selections = {
        [nodeId]: { kind: 'none' },
        [otherId]: { kind: 'set', set_id: 'other' },
      };
      service.get.mockReturnValue(of(document));
      component.load();
      component.setStartupForAll(true);
      const saved = service.save.mock.calls[0][2];
      expect(saved.selections[nodeId]).toEqual({ kind: 'set', set_id: setId });
      expect(saved.selections[otherId]).toEqual({ kind: 'none' });
      expect(saved.selections[vpcsId]).toEqual({ kind: 'none' });
      expect(saved.sets[1]).toEqual(document.sets[1]);
    });
  });

  describe('capture and restore jobs', () => {
    it('reports background export failures only through one notification and re-enables the dialog', () => {
      component.capture();
      expect(component.running()).toBe(true);
      service.status.mockReturnValue(
        of({
          jobs: [jobOf('capture', { [nodeId]: 'console_lease_unsupported' })],
          nodes: {},
        }),
      );
      vi.advanceTimersByTime(2000);
      fixture.detectChanges();
      expect(component.running()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('stop and start the node');
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('ASA1'));
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('stop and start the node'));
      vi.advanceTimersByTime(4000);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('explains how to recover an IOS XE configuration-mode export failure', () => {
      component.capture();
      service.status.mockReturnValue(
        of({
          jobs: [jobOf('capture', { [nodeId]: 'console_unsafe_mode' })],
          nodes: {},
        }),
      );
      vi.advanceTimersByTime(2000);
      fixture.detectChanges();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('enter end to leave configuration mode'));
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('hostname#'));
      expect(component.nodeStatus(nodeId)).toContain('exit configuration mode before exporting');
    });

    it('renders startup-specific wording for a boot media delivery', () => {
      const node = component.nodes()[0];
      node.properties = { ...node.properties, startup_media_profile: 'cisco-viptela' };
      component.status.set(nodeStatus('media_delivered'));
      expect(component.nodeStatus(nodeId)).toContain('Boot media delivered');
      expect(component.nodeStatus(nodeId)).toContain('Check the node console for the result');
    });

    it('reloads the captured configuration and reports success when the background export finishes', () => {
      component.capture();
      const saved = initial();
      saved.sets[0].nodes[nodeId] = { device_type: 'cisco_asa', content: 'ASA Version 9.19\n:end\n', enabled: false };
      service.get.mockReturnValue(of(saved));
      service.status.mockReturnValue(
        of({
          jobs: [jobOf('capture', { [nodeId]: 'captured' })],
          nodes: {},
        }),
      );
      vi.advanceTimersByTime(2000);
      expect(component.draft().content).toContain('ASA Version');
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('saves driver choices before capturing, and keeps actions locked across the save and capture requests', () => {
      const capture = new Subject<ConfigurationJob>();
      service.capture.mockReturnValue(capture);
      component.capture();
      expect(service.save).toHaveBeenCalled();
      expect(service.capture).toHaveBeenCalledWith({}, 'project', setId, [nodeId]);
      expect(component.busy()).toBe(true);
      component.capture();
      expect(service.capture).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(
        [...fixture.nativeElement.querySelectorAll('button')].find(
          (button: any) => button.textContent.trim() === 'Close',
        ).disabled,
      ).toBe(true);
      capture.next(jobOf('capture', {}, 'running'));
      capture.complete();
      expect(component.busy()).toBe(false);
      expect(component.running()).toBe(true);
    });

    it('does not start capture when saving conflicts with another session', () => {
      service.save.mockReturnValue(throwError(() => new Error('startup_configurations_changed')));
      component.draft.update((draft) => ({ ...draft, content: 'local draft' }));
      component.changed();
      component.capture();
      expect(service.capture).not.toHaveBeenCalled();
      expect(component.draft().content).toBe('local draft');
      expect(component.dirty()).toBe(true);
      expect(component.busy()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
    });

    it('renders the masked failure detail as escaped plain text, and nothing when absent', () => {
      const failed = {
        set_id: setId,
        status: 'configuration_apply_failed',
        phase: 'replay',
        command_index: 6,
        command_total: 101,
        command: 'password <masked> <b>x</b>',
        device_error: 'syntax error: password <masked>',
      };
      component.status.set({ jobs: [], nodes: { [nodeId]: failed } });
      fixture.detectChanges();
      const note: HTMLElement = fixture.nativeElement.querySelector('.failure-detail');
      expect(note.getAttribute('role')).toBe('note');
      expect(note.textContent).toContain(
        'Failed at applying configuration commands (command 6 of 101): password <masked> <b>x</b> -> syntax error: password <masked>',
      );
      expect(note.querySelector('b')).toBeNull();
      expect(note.querySelector('.failure-text')?.getAttribute('title')).toContain('command 6 of 101');
      expect(component.nodeStatus(nodeId).length).toBeLessThan(260);
      component.status.set(nodeStatus('configuration_apply_failed'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.failure-detail')).toBeNull();
      expect(component.failureDetail(nodeId)).toBe('');
    });

    it('shows missing startup results separately from successful export', () => {
      component.draft.set({ device_type: 'cisco_asa', content: 'hostname saved\n', enabled: true });
      component.status.set({
        jobs: [jobOf('capture', { [nodeId]: 'captured' }, 'finished', 'export')],
        nodes: {},
      });
      const message = component.nodeStatus(nodeId);
      expect(message).toContain('Startup: ON. To load this set, use Wipe node, then Start');
      expect(message).toContain('Export: saved to set');
      expect(message.indexOf('Startup:')).toBeLessThan(message.indexOf('Export:'));
      fixture.detectChanges();
      const text: string = fixture.nativeElement.textContent;
      expect(text.match(/ordinary restarts preserve the device['’]s saved configuration/gi)).toHaveLength(1);
    });

    it('reports missing, disabled and other-set startup configurations without an export job', () => {
      expect(component.nodeStatus(nodeId)).toContain('no saved configuration');
      component.draft.set({ device_type: 'cisco_asa', content: 'hostname saved\n', enabled: false });
      expect(component.nodeStatus(nodeId)).toContain('Startup: OFF');
      component.addSet(false, 'Recovery');
      component.draft.set({ device_type: 'cisco_asa', content: 'hostname saved\n', enabled: true });
      expect(component.nodeStatus(nodeId)).toContain('Startup: None');
      expect(component.nodeStatus(nodeId)).toContain('Enable this node to use the viewed set');
    });

    it('keeps the pending startup restore visible alongside previous exports', () => {
      component.status.set({
        jobs: [jobOf('capture', { [nodeId]: 'captured' }, 'finished', 'export')],
        nodes: { [nodeId]: { set_id: setId, status: 'waiting_for_console' } },
      });
      expect(component.nodeStatus(nodeId)).toContain('Startup: Waiting for the device to boot');
      expect(component.nodeStatus(nodeId)).toContain('Export: saved to set');
      expect(component.nodeStatus(nodeId).length).toBeLessThan(120);
      expect(component.waitingHint(nodeId)).toContain('Close any open console window');
    });

    it('explains a restore refused for a non-Telnet/SSH console, and labels explicit live application separately', () => {
      component.status.set(nodeStatus('configuration_restore_console_required'));
      expect(component.nodeStatus(nodeId)).toContain('Telnet or SSH');
      component.status.set({
        jobs: [jobOf('apply', { [nodeId]: 'applied' }, 'finished', 'apply')],
        nodes: {},
      });
      expect(component.nodeStatus(nodeId)).toContain('Apply: Saved configuration applied successfully.');
    });

    it.each([
      ['VPCS saved scripts', vpcsId, 'vpcs'],
      ['the saved Linux network file of Webterm', webtermId, 'linux_interfaces'],
    ])('offers %s without console credentials', (_name, id, deviceType) => {
      component.selectNode(id);
      fixture.detectChanges();
      expect(component.draft().device_type).toBe(deviceType);
      expect(fixture.nativeElement.querySelector('details')).toBeNull();
      const fetch = fixture.nativeElement.querySelector('[aria-label="Fetch from device"]') as HTMLButtonElement;
      expect(fetch.disabled).toBe(false);
      expect(fetch.parentElement.getAttribute('matTooltip')).toBe('Fetch from device and save to this set');
      expect(fetch.querySelector('mat-icon').textContent.trim()).toBe('sync');
      component.capture();
      expect(service.capture).toHaveBeenCalledWith({}, 'project', setId, [id]);
    });
  });

  describe('configuration sets and archives', () => {
    it('creates a set with the supplied name and no generic default', () => {
      answerDialog('Before routing');
      component.nameSet('create');
      expect(nameDialog.open.mock.calls[0][1].data.name).toBe('');
      expect(component.currentSet().name).toBe('Before routing');
      expect(component.currentSet().nodes).toEqual({});
      expect(component.dirty()).toBe(false);
      expect(service.save).toHaveBeenCalledOnce();
    });

    it('leaves the document and draft untouched when naming is cancelled', () => {
      component.draft.update((draft) => ({ ...draft, content: 'local changes' }));
      const document = structuredClone(component.document());
      component.nameSet('create');
      expect(component.document()).toEqual(document);
      expect(component.draft().content).toBe('local changes');
      expect(component.busy()).toBe(false);
      expect(component.dirty()).toBe(false);
      expect(service.save).not.toHaveBeenCalled();
    });

    it('renames the selected set without changing its identity or configuration', () => {
      component.addSet(false, 'Custom');
      component.save();
      service.save.mockClear();
      const before = structuredClone(component.currentSet());
      answerDialog('Baseline');
      component.nameSet('rename');
      expect(component.currentSet()).toEqual({ ...before, name: 'Baseline' });
      expect(component.dirty()).toBe(false);
      expect(service.save).toHaveBeenCalledOnce();
      expect(nameDialog.open.mock.calls[0][1].data.names).toEqual(['Default']);
    });

    it.each([false, undefined])('keeps the set and draft when deletion is cancelled (%s)', (result) => {
      component.addSet(false, 'Before routing');
      component.draft.update((draft) => ({ ...draft, content: 'unsaved configuration' }));
      const before = structuredClone(component.document());
      const viewing = component.viewing();
      answerDialog(result);
      component.deleteSet();
      expect(nameDialog.open.mock.calls[0][1].data.message).toContain('Before routing');
      expect(component.document()).toEqual(before);
      expect(component.viewing()).toBe(viewing);
      expect(component.draft().content).toBe('unsaved configuration');
      expect(component.busy()).toBe(false);
      expect(service.save).not.toHaveBeenCalled();
    });

    it('waits for confirmation before removing the startup set', () => {
      component.addSet(false, 'Before routing');
      component.document.update((document) => ({ ...document, selected: component.viewing() }));
      const deletedId = component.viewing();
      const response = new Subject<boolean>();
      nameDialog.open.mockReturnValue({ afterClosed: () => response });
      component.deleteSet();
      expect(component.document().sets).toHaveLength(2);
      expect(component.busy()).toBe(true);
      expect(nameDialog.open.mock.calls[0][1].data.details.join(' ')).toContain('Default');
      response.next(true);
      response.complete();
      expect(component.document().sets.map((set) => set.id)).not.toContain(deletedId);
      expect(component.document().selected).toBe(setId);
      expect(component.viewing()).toBe(setId);
      expect(component.busy()).toBe(false);
      expect(component.dirty()).toBe(false);
      expect(service.save).toHaveBeenCalledOnce();
    });

    it('keeps the dialog busy until a confirmed rename has been saved', () => {
      component.addSet(false, 'Custom');
      const saved = new Subject<StartupDocument>();
      service.save.mockReturnValue(saved);
      answerDialog('New baseline');
      component.nameSet('rename');
      expect(component.busy()).toBe(true);
      const submitted = structuredClone(service.save.mock.calls[0][2]);
      saved.next({ ...submitted, revision: submitted.revision + 1 });
      saved.complete();
      expect(component.busy()).toBe(false);
      expect(component.dirty()).toBe(false);
      expect(component.document().revision).toBe(1);
    });

    it.each(['create', 'copy', 'rename', 'delete'] as const)(
      'restores the local state and unsaved edits if automatic %s saving fails',
      (operation) => {
        component.addSet(false, 'Before routing');
        component.draft.update((draft) => ({ ...draft, content: 'local unsaved changes' }));
        component.changed();
        const before = structuredClone(component.document());
        const draft = component.draft();
        const viewing = component.viewing();
        service.save.mockReturnValue(throwError(() => new Error('startup_configurations_changed')));
        answerDialog(operation === 'delete' ? true : 'New baseline');
        if (operation === 'delete') component.deleteSet();
        else component.nameSet(operation);
        expect(service.save).toHaveBeenCalledOnce();
        expect(component.document()).toEqual(before);
        expect(component.draft()).toEqual(draft);
        expect(component.viewing()).toBe(viewing);
        expect(component.dirty()).toBe(true);
        expect(component.busy()).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
      },
    );

    it('saves a copy with the current edits automatically and keeps the copy independent of its source', () => {
      component.draft.update((draft) => ({ ...draft, content: 'hostname updated\n' }));
      component.changed();
      answerDialog('Updated baseline');
      component.nameSet('copy');
      expect(service.save).toHaveBeenCalledOnce();
      const saved = service.save.mock.calls[0][2];
      expect(saved.sets[0].nodes[nodeId].content).toBe('hostname updated\n');
      expect(saved.sets[1].nodes[nodeId].content).toBe('hostname updated\n');
      expect(component.currentSet().name).toBe('Updated baseline');
      expect(component.dirty()).toBe(false);
      // Editing the copy does not touch the original set.
      component.draft.update((draft) => ({ ...draft, content: 'hostname clone\n' }));
      component.changed();
      component.setStartupForAll(true);
      const document = component.document();
      expect(document.sets[0].nodes[nodeId].content).toBe('hostname updated\n');
      expect(document.sets[1].nodes[nodeId].content).toBe('hostname clone\n');
      expect(document.selected).toBe(document.sets[1].id);
    });

    it('does not offer deletion of the last set, and protects Default from rename and deletion', () => {
      component.deleteSet();
      expect(nameDialog.open).not.toHaveBeenCalled();
      expect(component.document().sets).toHaveLength(1);
      component.addSet(false, 'Custom');
      component.selectSet(setId);
      component.nameSet('rename');
      component.deleteSet();
      expect(nameDialog.open).not.toHaveBeenCalled();
    });

    describe('set archives (ZIP)', () => {
      const archive = (size = 64) => ({
        name: 'My Lab.zip',
        size,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      });
      const input = (file = archive()) => ({ files: [file], value: 'My Lab.zip' });
      const imported: SetImportResult = {
        set: { id: 'new-set', name: 'Restored' },
        mapped: {},
        matched_by_name: [],
        skipped: [],
      };
      beforeEach(() => {
        service.importSet.mockReturnValue(of(imported));
        service.exportSet.mockReturnValue(of(new Blob(['zip'])));
      });

      it('offers set archive import and export', () => {
        expect(fixture.nativeElement.querySelector('[aria-label="Import set from archive"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[aria-label="Export set as archive"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('input[type="file"][accept*="zip"]')).not.toBeNull();
      });

      it('imports as a new set the user names (default from the file name) and shows it afterwards', async () => {
        const afterImport = initial();
        afterImport.sets.push({ id: 'new-set', name: 'Restored', nodes: {} });
        service.get.mockReturnValue(of(afterImport));
        answerDialog('Restored');
        const chosen = input();
        await component.importSet({ target: chosen } as unknown as Event);
        const data = nameDialog.open.mock.calls[0][1].data;
        expect(data.name).toBe('My Lab');
        expect(data.names).toEqual(['Default']);
        expect(service.importSet).toHaveBeenCalledWith({}, 'project', new Uint8Array([1, 2, 3]), 'Restored');
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Imported configuration set "Restored"'));
        expect(component.viewing()).toBe('new-set');
        expect(chosen.value).toBe('');
        expect(component.busy()).toBe(false);
      });

      it('does nothing when the name dialog is cancelled, and resets the input', async () => {
        answerDialog(undefined);
        const chosen = input();
        await component.importSet({ target: chosen } as unknown as Event);
        expect(service.importSet).not.toHaveBeenCalled();
        expect(component.busy()).toBe(false);
        expect(chosen.value).toBe('');
      });

      it('refuses an archive above 24 MiB, unsaved edits and a full project without opening the dialog', async () => {
        await component.importSet({ target: input(archive(24 * 1024 * 1024 + 1)) } as unknown as Event);
        expect(toast.error).toHaveBeenCalledWith('The archive exceeds 24 MiB.');
        component.dirty.set(true);
        const dirtyInput = input();
        await component.importSet({ target: dirtyInput } as unknown as Event);
        expect(dirtyInput.value).toBe('');
        component.dirty.set(false);
        component.document.update((document) => ({
          ...document,
          sets: Array.from({ length: 32 }, (_, index) => ({ id: `s${index}`, name: `S${index}`, nodes: {} })),
        }));
        await component.importSet({ target: input() } as unknown as Event);
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('maximum number of configuration sets'));
        expect(nameDialog.open).not.toHaveBeenCalled();
        expect(service.importSet).not.toHaveBeenCalled();
      });

      it('explains an invalid archive from the server', async () => {
        answerDialog('Restored');
        service.importSet.mockReturnValue(
          throwError(() => ({ status: 422, error: { message: 'invalid_configuration_archive' } })),
        );
        await component.importSet({ target: input() } as unknown as Event);
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not a valid configuration set archive'));
        expect(component.busy()).toBe(false);
      });

      it('warns that the archive may contain secrets, then downloads it named after the set with unsafe characters replaced', () => {
        const download = captureDownloads();
        answerDialog(true);
        component.exportSet();
        const data = nameDialog.open.mock.calls[0][1].data;
        expect(data.details.join(' ')).toContain('secrets');
        expect(service.exportSet).toHaveBeenCalledWith({}, 'project', setId, component.document().revision);
        expect(download.names).toEqual(['Default.zip']);
        expect(component.busy()).toBe(false);
        component.currentSet().name = 'Lab/1';
        component.exportSet();
        expect(download.names).toEqual(['Default.zip', 'Lab_1.zip']);
      });

      it('does not export when the warning is declined, or while edits are unsaved', () => {
        answerDialog(false);
        component.exportSet();
        expect(service.exportSet).not.toHaveBeenCalled();
        expect(component.busy()).toBe(false);
        component.dirty.set(true);
        component.exportSet();
        expect(nameDialog.open).toHaveBeenCalledTimes(1);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[aria-label="Export set as archive"]').disabled).toBe(true);
      });

      it('maps an export permission error, including a Blob error body', async () => {
        const body = new Blob([JSON.stringify({ message: 'configuration_access_denied' })]);
        service.exportSet.mockReturnValue(throwError(() => ({ status: 403, error: body })));
        answerDialog(true);
        component.exportSet();
        await vi.advanceTimersByTimeAsync(0);
        await Promise.resolve();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('permission'));
      });
    });
  });
});
