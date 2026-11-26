import {
  captureDownloads,
  noStartupMediaProfiles,
  configurationDocumentMocks,
  configurationEditorUiMocks,
  configurationJob,
  startupDocument,
} from '../../configuration-editor.testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StartupMediaProfilesService } from '@services/startup-media-profiles.service';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import { ConfigurationJob, STARTUP_DEFAULT_SET_ID, StartupDocument } from '@models/startup-configuration';
import { ToasterService } from '@services/toaster.service';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeConfigurationComponent } from './node-configuration.component';

const setId = STARTUP_DEFAULT_SET_ID;
const nodeId = '10000000-0000-0000-0000-000000000001';
const initial = () =>
  startupDocument({
    revision: 3,
    sets: [
      {
        id: setId,
        name: 'Baseline',
        nodes: { [nodeId]: { device_type: 'cisco_ios_telnet', content: 'hostname old\n', enabled: true } },
      },
    ],
  });

function configurationMocks() {
  return {
    ...configurationDocumentMocks(initial),
    captureNode: vi.fn<StartupConfigurationsService['captureNode']>(() => of(initial())),
    apply: vi.fn<StartupConfigurationsService['apply']>(() =>
      of(configurationJob({ operation: 'apply', status: 'running' })),
    ),
    waitForJob: vi.fn<StartupConfigurationsService['waitForJob']>(() =>
      of(configurationJob({ operation: 'apply', nodes: { [nodeId]: 'applied' } })),
    ),
  };
}

describe('Node configuration tab', () => {
  let fixture: ComponentFixture<NodeConfigurationComponent>;
  let component: NodeConfigurationComponent;
  let service: ReturnType<typeof configurationMocks>;
  let toast: ReturnType<typeof configurationEditorUiMocks>['toast'];
  let dialog: ReturnType<typeof configurationEditorUiMocks>['dialog'];
  let ref: ReturnType<typeof configurationEditorUiMocks>['dialogRef'];
  beforeEach(async () => {
    service = configurationMocks();
    ({ toast, dialog, dialogRef: ref } = configurationEditorUiMocks(false));
    await TestBed.configureTestingModule({
      imports: [NodeConfigurationComponent],
      providers: [
        { provide: StartupConfigurationsService, useValue: service },
        { provide: ToasterService, useValue: toast },
        { provide: MatDialogRef, useValue: ref },
        { provide: StartupMediaProfilesService, useValue: noStartupMediaProfiles },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();
    fixture = TestBed.createComponent(NodeConfigurationComponent);
    fixture.componentRef.setInput('controller', {});
    fixture.componentRef.setInput('node', {
      node_id: nodeId,
      project_id: 'project',
      node_type: 'qemu',
      status: 'started',
      console_type: 'telnet',
      name: 'R1',
      netmiko_device_type: 'cisco_ios',
      locked: false,
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('loads the same selected-set entry as the startup dialog, and saves shared-editor edits to it without applying them or changing startup ON/OFF', () => {
    expect(component.content()).toBe('hostname old\n');
    expect(component.setId()).toBe(setId);
    expect(component.saved().enabled).toBe(true);
    expect(component.dirty()).toBe(false);
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'hostname edited\n';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.dirty()).toBe(true);
    expect(ref.disableClose).toBe(true);
    expect(component.canLeave()).toBe(false);
    component.save();
    expect(service.save.mock.calls[0][2].sets[0].nodes[nodeId]).toEqual({
      device_type: 'cisco_ios_telnet',
      content: 'hostname edited\n',
      enabled: true,
    });
    expect(service.apply).not.toHaveBeenCalled();
    expect(component.dirty()).toBe(false);
    fixture.detectChanges();
    expect(ref.disableClose).toBe(false);
  });
  it('saves pending edits before the parent Apply continues without applying to the device', () => {
    component.content.set('hostname auto-saved\n');
    const pending = new Subject<StartupDocument>();
    service.save.mockReturnValue(pending);
    const next = vi.fn();
    component.saveBeforeApply().subscribe(next);
    expect(next).not.toHaveBeenCalled();
    expect(component.busy()).toBe(true);
    expect(component.canLeave()).toBe(false);
    pending.next({ ...service.save.mock.calls[0][2], revision: 4 });
    expect(next).toHaveBeenCalledWith(true);
    expect(component.content()).toBe('hostname auto-saved\n');
    expect(component.dirty()).toBe(false);
    expect(component.busy()).toBe(false);
    expect(component.canLeave()).toBe(true);
    expect(service.apply).not.toHaveBeenCalled();
    pending.complete();
  });
  it('keeps the draft and prevents the parent Apply after a configuration save failure', () => {
    component.content.set('hostname retry\n');
    service.save.mockReturnValue(throwError(() => ({ error: { message: 'startup_configurations_changed' } })));
    const next = vi.fn();
    component.saveBeforeApply().subscribe(next);
    expect(next).toHaveBeenCalledWith(false);
    expect(component.content()).toBe('hostname retry\n');
    expect(component.dirty()).toBe(true);
    expect(component.busy()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
  });
  it('skips saving an unchanged configuration and refuses to overlap another operation', () => {
    const next = vi.fn();
    component.saveBeforeApply().subscribe(next);
    expect(next).toHaveBeenLastCalledWith(true);
    expect(service.save).not.toHaveBeenCalled();
    component.busy.set(true);
    component.saveBeforeApply().subscribe(next);
    expect(next).toHaveBeenLastCalledWith(false);
    expect(service.save).not.toHaveBeenCalled();
  });
  it('persists startup ON/OFF from the switch without saving text edits or applying to the node', () => {
    component.content.set('hostname unsaved\n');
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[role="switch"]');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    toggle.click();
    fixture.detectChanges();
    expect(service.save.mock.calls[0][2].sets[0].nodes[nodeId]).toEqual({
      device_type: 'cisco_ios_telnet',
      content: 'hostname old\n',
      enabled: false,
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(component.content()).toBe('hostname unsaved\n');
    expect(component.dirty()).toBe(true);
    toggle.click();
    expect(service.save.mock.calls[1][2].revision).toBe(4);
    expect(component.saved().enabled).toBe(true);
    expect(service.apply).not.toHaveBeenCalled();
  });
  it('retains the saved startup state and text edits when toggling fails', () => {
    service.save.mockReturnValue(throwError(() => ({ error: { message: 'startup_configurations_changed' } })));
    component.content.set('hostname unsaved\n');
    component.toggleStartup();
    expect(component.startupEnabled()).toBe(true);
    expect(component.content()).toBe('hostname unsaved\n');
    expect(component.busy()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
  });
  it('assigns the displayed set only to this node and retains other saved entries', () => {
    const document = initial();
    document.sets.push({
      id: 'other',
      name: 'Other',
      nodes: {
        [nodeId]: { device_type: 'cisco_ios_telnet', content: 'hostname other\n', enabled: false },
        neighbor: { device_type: 'vpcs', content: 'ip dhcp\n', enabled: true },
      },
    });
    service.get.mockReturnValue(of(document));
    component.load();
    component.chooseSet({ value: 'other' } as any);
    const saved = service.save.mock.calls[0][2];
    expect(saved.selected).toBe(setId);
    expect(saved.selections[nodeId]).toEqual({ kind: 'set', set_id: 'other' });
    expect(saved.sets[0]).toEqual(document.sets[0]);
    expect(saved.sets[1].nodes[nodeId].enabled).toBe(true);
    expect(saved.sets[1].nodes.neighbor).toEqual(document.sets[1].nodes.neighbor);
    expect(component.content()).toBe('hostname other\n');
    expect(component.dirty()).toBe(false);
  });
  it.each(['', '   \n'])('disables startup for empty saved content (%j)', (content) => {
    const document = initial();
    document.sets[0].nodes[nodeId].content = content;
    service.get.mockReturnValue(of(document));
    component.load();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="switch"]').disabled).toBe(true);
    expect(component.startupEnabled()).toBe(false);
    component.toggleStartup();
    expect(service.save).not.toHaveBeenCalled();
  });
  it('does not overwrite unsaved edits when Fetch is cancelled', () => {
    component.content.set('hostname unsaved\n');
    component.fetch();
    expect(dialog.open).toHaveBeenCalled();
    expect(service.captureNode).not.toHaveBeenCalled();
    expect(component.content()).toBe('hostname unsaved\n');
  });
  it('loads the captured configuration only after explicit replacement of edits', () => {
    component.content.set('hostname unsaved\n');
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    const captured = initial();
    captured.sets[0].nodes[nodeId].content = 'hostname fetched\n';
    service.captureNode.mockReturnValue(of(captured));
    component.fetch();
    expect(service.captureNode).toHaveBeenCalledWith({}, expect.objectContaining({ node_id: nodeId }), setId);
    expect(component.content()).toBe('hostname fetched\n');
    expect(component.saved().enabled).toBe(true);
  });
  it('protects edits when switching sets is cancelled', () => {
    component.content.set('hostname unsaved\n');
    // The select shows the requested set while the confirmation is open, then reverts by data
    // (no poking at the control) when the user declines.
    component.chooseSet({ value: 'other' } as any);
    expect(component.selectedSetId()).toBe(setId);
    expect(component.setId()).toBe(setId);
    expect(component.content()).toBe('hostname unsaved\n');
  });
  it('requires saved edits and confirmation before applying', () => {
    component.content.set('hostname unsaved\n');
    component.apply();
    expect(dialog.open).not.toHaveBeenCalled();
    component.discard();
    component.apply();
    expect(service.apply).not.toHaveBeenCalled();
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    component.apply();
    expect(service.apply).toHaveBeenCalledWith({}, expect.objectContaining({ node_id: nodeId }), setId, 3);
    expect(component.result()).toContain('accepted the configuration');
    expect(service.save).not.toHaveBeenCalled();
  });
  it('blocks closure while a live apply is running', () => {
    const pending = new Subject<ConfigurationJob>();
    service.waitForJob.mockReturnValue(pending);
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    component.apply();
    fixture.detectChanges();
    expect(ref.disableClose).toBe(true);
    expect(component.canLeave()).toBe(false);
    pending.next(configurationJob({ operation: 'apply', nodes: { [nodeId]: 'applied' } }));
    pending.complete();
    fixture.detectChanges();
    expect(component.canLeave()).toBe(true);
  });
  it('never offers live apply of a Viptela entry, which the server refuses', () => {
    const document = initial();
    document.sets[0].nodes[nodeId] = {
      device_type: 'cisco_viptela',
      content: 'system\n host-name live\n!\n',
      enabled: false,
    };
    service.get.mockReturnValue(of(document));
    component.load();
    expect(component.canApply()).toBe(false);
  });
  it('blocks live apply when the saved entry belongs to a different QEMU recipe', () => {
    expect(component.canApply()).toBe(true);
    fixture.componentRef.setInput('node', { ...component.node(), netmiko_device_type: 'cisco_nxos' });
    fixture.detectChanges();
    expect(component.canApply()).toBe(false);
    component.apply();
    expect(service.apply).not.toHaveBeenCalled();
  });
  it('evaluates blockers and the toggle from the pending profile before the node is saved', () => {
    const document = initial();
    document.sets[0].nodes[nodeId] = { device_type: 'cisco_viptela', content: 'system\n', enabled: false };
    service.get.mockReturnValue(of(document));
    fixture.componentRef.setInput('node', { ...component.node(), netmiko_device_type: null, console_type: 'vnc' });
    component.load();
    component.mediaProfile.set('');
    expect(component.canToggleStartup()).toBe(false);
    component.mediaProfile.set('cisco-viptela');
    expect(component.startupHint()).toBe('');
    expect(component.canToggleStartup()).toBe(true);
    expect(component.driver()).toBe('cisco_viptela');
    component.mediaProfile.set('cisco-c8000v-autonomous');
    expect(component.startupHint()).toContain('different device type');
  });
  it('checks pending boot settings independently of the running guest recipe', () => {
    expect(component.canApply()).toBe(true);
    fixture.componentRef.setInput('netmikoDeviceType', 'cisco_nxos');
    component.mediaProfile.set('cisco-iosv');
    fixture.detectChanges();
    expect(component.startupHint()).toContain('different device type');
    expect(component.canApply()).toBe(true);
    expect(component.canFetch()).toBe(true);
    fixture.componentRef.setInput('netmikoDeviceType', null);
    fixture.detectChanges();
    expect(component.startupHint()).toBe('');
  });
  it('shows the profile select next to the set select on QEMU nodes only', () => {
    const heading = fixture.nativeElement.querySelector('.configuration-heading') as HTMLElement;
    expect(heading.querySelector('app-startup-media-profile-select')).not.toBeNull();
    fixture.componentRef.setInput('node', { ...component.node(), node_type: 'iou' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-startup-media-profile-select')).toBeNull();
  });
  it.each([
    ['docker', 'linux_interfaces'],
    ['vpcs', 'vpcs'],
  ] as const)('disables live apply and console capture on a %s node', (node_type, device_type) => {
    fixture.componentRef.setInput('node', { ...component.node(), node_type, netmiko_device_type: null });
    const document = initial();
    document.sets[0].nodes[nodeId].device_type = device_type;
    service.get.mockReturnValue(of(document));
    component.load();
    expect(component.canApply()).toBe(false);
    component.apply();
    expect(service.apply).not.toHaveBeenCalled();
  });
  it('writes the node’s current console recipe as the QEMU entry type, also when General settings change in place', () => {
    fixture.componentRef.setInput('node', { ...component.node(), netmiko_device_type: 'cisco_xe_ssh' });
    expect(component.driver()).toBe('cisco_ios_telnet');
    fixture.componentRef.setInput('node', { ...component.node(), netmiko_device_type: 'cisco_nxos' });
    expect(component.driver()).toBe('cisco_nxos');
    component.content.set('hostname new\n');
    component.save();
    expect(service.save.mock.calls[0][2].sets[0].nodes[nodeId].device_type).toBe('cisco_nxos');
    // The configurator mutates the same node object before it saves the Configuration tab.
    component.node().netmiko_device_type = 'cisco_ios';
    component.content.set('hostname moved\n');
    component.saveBeforeApply().subscribe();
    expect(service.save.mock.calls[1][2].sets[0].nodes[nodeId].device_type).toBe('cisco_ios_telnet');
  });
  it('does not start a new entry ON on a QEMU node whose console cannot restore it', () => {
    const document = initial();
    document.sets[0].nodes = {};
    service.get.mockReturnValue(of(document));
    component.load();
    component.node().console_type = 'vnc';
    component.content.set('hostname fresh\n');
    component.save();
    const saved = service.save.mock.calls[0][2];
    expect(saved.sets[0].nodes[nodeId].enabled).toBe(false);
    expect(saved.selections[nodeId]).toEqual({ kind: 'none' });
  });
  it('shows the restore blocker inline and refuses to enable startup', () => {
    const document = initial();
    document.sets[0].nodes[nodeId].enabled = false;
    service.get.mockReturnValue(of(document));
    fixture.componentRef.setInput('node', { ...component.node(), console_type: 'vnc' });
    component.load();
    fixture.detectChanges();
    expect(component.canToggleStartup()).toBe(false);
    expect(fixture.nativeElement.querySelector('p[role="note"]').textContent).toContain('Telnet or SSH');
    component.toggleStartup();
    expect(service.save).not.toHaveBeenCalled();
  });
  it('lets the user turn startup off even when the node can no longer restore it', () => {
    fixture.componentRef.setInput('node', { ...component.node(), console_type: 'vnc' });
    expect(component.saved().enabled).toBe(true);
    expect(component.canToggleStartup()).toBe(true);
  });

  it('downloads the saved configuration under the node name', () => {
    const document = initial();
    document.sets[0].nodes[nodeId] = {
      device_type: 'cisco_asa',
      content: 'hostname asav',
      enabled: false,
    };
    service.get.mockReturnValue(of(document));
    component.load();
    const downloads = captureDownloads();
    component.download();
    // The extension comes from the device type; the shared download helper has its own spec.
    expect(downloads.names).toEqual(['R1_configuration.cfg']);
  });
  it('opens the node assignment and saves edits without switching other nodes or the project default', () => {
    const document = initial();
    document.sets.push({
      id: 'other',
      name: 'Other',
      nodes: {
        [nodeId]: { device_type: 'cisco_ios_telnet', content: 'hostname other\n', enabled: true },
      },
    });
    document.selection_revision = 7;
    document.selections = {
      [nodeId]: { kind: 'set', set_id: 'other' },
      neighbor: { kind: 'set', set_id: setId },
    };
    service.get.mockReturnValue(of(document));
    component.load();
    expect(component.setId()).toBe('other');
    expect(component.startupEnabled()).toBe(true);
    component.content.set('hostname edited-other\n');
    component.save();
    const saved = service.save.mock.calls[0][2];
    expect(saved.selected).toBe(setId);
    expect(saved.selections).toEqual(document.selections);
    expect(saved.selection_revision).toBe(7);
    expect(saved.sets[0]).toEqual(document.sets[0]);
    expect(saved.sets[1].nodes[nodeId].content).toBe('hostname edited-other\n');
  });
  it('keeps the previous assignment and editor when selecting a different set fails', () => {
    const document = initial();
    document.sets.push({ id: 'other', name: 'Other', nodes: {} });
    service.get.mockReturnValue(of(document));
    component.load();
    service.save.mockReturnValue(throwError(() => new Error('startup_configurations_changed')));
    component.chooseSet({ value: 'other' } as any);
    expect(component.setId()).toBe(setId);
    expect(component.selectedSetId()).toBe(setId);
    expect(component.content()).toBe('hostname old\n');
    expect(component.startupEnabled()).toBe(true);
    expect(component.busy()).toBe(false);
  });
  it('can assign an empty set and enable it when the first configuration is saved', () => {
    const document = initial();
    document.sets.push({ id: 'other', name: 'Other', nodes: {} });
    service.get.mockReturnValue(of(document));
    component.load();
    component.chooseSet({ value: 'other' } as any);
    expect(component.setId()).toBe('other');
    expect(component.startupEnabled()).toBe(false);
    component.content.set('hostname first\n');
    component.save();
    expect(component.startupEnabled()).toBe(true);
    expect(component.document().selected).toBe(setId);
    expect(component.document().selections[nodeId]).toEqual({ kind: 'set', set_id: 'other' });
  });
  it('clears an explicit assignment for a running node without touching the device', () => {
    const document = initial();
    document.selection_revision = 2;
    document.selections = { [nodeId]: { kind: 'set', set_id: setId } };
    service.get.mockReturnValue(of(document));
    component.load();
    component.toggleStartup();
    const saved = service.save.mock.calls[0][2];
    expect(saved.sets[0].nodes[nodeId].enabled).toBe(false);
    expect(saved.sets[0].nodes[nodeId].content).toBe('hostname old\n');
    expect(saved.selections[nodeId]).toEqual({ kind: 'none' });
    expect(saved.selection_revision).toBe(2);
    expect(component.startupEnabled()).toBe(false);
    expect(component.node().status).toBe('started');
    expect(service.apply).not.toHaveBeenCalled();
    expect(service.captureNode).not.toHaveBeenCalled();
  });

  it('reports a revision conflict and preserves pending edits', () => {
    service.save.mockReturnValue(throwError(() => ({ error: { message: 'startup_configurations_changed' } })));
    component.content.set('hostname Pending\n');
    component.save();
    expect(component.content()).toBe('hostname Pending\n');
    expect(component.dirty()).toBe(true);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('another session'));
  });
  it('reports a load failure once as a toast and inline, without a duplicate', () => {
    service.get.mockReturnValue(throwError(() => ({ status: 403, error: { message: 'configuration_access_denied' } })));
    toast.error.mockClear();
    component.load();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(component.loadError()).toBe(toast.error.mock.calls[0][0]);
    expect(component.loadError()).not.toContain('configuration_access_denied');
    expect(component.loadError()).toContain('permission');
  });
  it('reports a live apply as accepted, and says where a failed one stopped', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    service.waitForJob.mockReturnValue(
      of(configurationJob({ operation: 'apply', nodes: { [nodeId]: 'configuration_apply_accepted' } })),
    );
    component.apply();
    expect(component.result()).toContain('accepted the configuration');
    service.waitForJob.mockReturnValue(
      of(
        configurationJob({
          operation: 'apply',
          nodes: { [nodeId]: 'configuration_apply_failed' },
          details: { [nodeId]: { phase: 'prepare', command: 'hostname x' } },
        }),
      ),
    );
    component.apply();
    expect(component.result()).toContain('hostname x');
  });
  it.each([
    [
      'a failure code',
      () => of(configurationJob({ operation: 'apply', nodes: { [nodeId]: 'console_not_ready' } })),
      'not ready for restore',
    ],
    [
      'a job that outlasts the wait',
      () => throwError(() => new Error('configuration_job_still_running')),
      'still running on the server',
    ],
  ] as const)('explains a live apply failure with %s in words, not as a bare code', (_name, job, text) => {
    service.waitForJob.mockReturnValue(job());
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    component.apply();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(text));
  });
});
