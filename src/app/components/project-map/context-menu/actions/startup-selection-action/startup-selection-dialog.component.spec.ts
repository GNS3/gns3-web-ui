import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import { ToasterService } from '@services/toaster.service';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NEW_SET, StartupSelectionDialogComponent } from './startup-selection-dialog.component';

const document = {
  version: 1,
  revision: 4,
  selection_revision: 2,
  selected: 'default',
  sets: [
    { id: 'default', name: 'Default', nodes: {} },
    { id: 'core', name: 'Core', nodes: {} },
  ],
};
const nodes = [
  { node_id: 'a', name: 'R1', node_type: 'qemu', project_id: 'p' },
  { node_id: 'b', name: 'R2', node_type: 'qemu', project_id: 'p' },
] as any;

describe('StartupSelectionDialogComponent', () => {
  let service: any;
  let toaster: any;
  let dialogRef: any;

  function create() {
    const fixture = TestBed.createComponent(StartupSelectionDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    service = {
      get: vi.fn().mockReturnValue(of(structuredClone(document))),
      createSet: vi.fn().mockReturnValue(of({ revision: 5, set: { id: 'new-id', name: 'Lab' } })),
      capture: vi.fn().mockReturnValue(of({ id: 'job', status: 'finished', nodes: {} })),
      waitForJob: vi
        .fn()
        .mockReturnValue(of({ id: 'job', status: 'finished', nodes: { a: 'captured', b: 'start_required' } })),
      assignSelection: vi.fn().mockReturnValue(of({ revision: 3, node_ids: ['a', 'b'], without_startup: ['b'] })),
    };
    toaster = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn(), disableClose: false };
    TestBed.configureTestingModule({
      imports: [StartupSelectionDialogComponent],
      providers: [
        { provide: StartupConfigurationsService, useValue: service },
        { provide: ToasterService, useValue: toaster },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: {}, projectId: 'p', nodes } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('captures the selected nodes into an existing set and reports what failed', () => {
    const component = create();
    component.setId.set('core');
    component.apply();
    expect(service.createSet).not.toHaveBeenCalled();
    expect(service.capture).toHaveBeenCalledWith({}, 'p', 'core', ['a', 'b']);
    expect(toaster.success).toHaveBeenCalledWith('Captured 1 of 2 nodes into "Core". Startup ON/OFF is unchanged.');
    expect(toaster.warning.mock.calls[0][0]).toContain('R2:');
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('creates the named set first when a new set is chosen', () => {
    const component = create();
    component.setId.set(NEW_SET);
    expect(component.canApply()).toBe(false);
    component.newName.set('  Lab ');
    component.apply();
    expect(service.createSet).toHaveBeenCalledWith({}, 'p', 'Lab', 4);
    expect(service.capture).toHaveBeenCalledWith({}, 'p', 'new-id', ['a', 'b']);
  });

  it('assigns a set at the assignment revision and names the nodes without an enabled entry', () => {
    const component = create();
    component.setMode('assign');
    component.setId.set('core');
    component.apply();
    expect(service.assignSelection).toHaveBeenCalledWith({}, 'p', ['a', 'b'], { kind: 'set', set_id: 'core' }, 2);
    expect(toaster.success.mock.calls[0][0]).toContain('"Core" assigned to 2 nodes');
    expect(toaster.warning.mock.calls[0][0]).toContain('R2');
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('clears the startup choice of the selected nodes', () => {
    const component = create();
    component.setMode('clear');
    component.apply();
    expect(service.assignSelection).toHaveBeenCalledWith({}, 'p', ['a', 'b'], { kind: 'none' }, 2);
    expect(toaster.success.mock.calls[0][0]).toContain('Startup cleared for 2 nodes');
  });

  it('does not offer a new, empty set outside a capture', () => {
    const component = create();
    component.setId.set(NEW_SET);
    component.setMode('assign');
    expect(component.setId()).toBe('default');
  });

  it('stays open and shows the error when the server refuses', () => {
    service.assignSelection.mockReturnValue(throwError(() => ({ status: 403 })));
    const component = create();
    component.setMode('clear');
    component.apply();
    expect(toaster.error).toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.busy()).toBe(false);
    expect(dialogRef.disableClose).toBe(false);
  });

  it('cannot apply while the project sets could not be loaded', () => {
    service.get.mockReturnValue(throwError(() => ({ status: 500 })));
    const component = create();
    expect(component.loadError()).not.toBe('');
    expect(component.canApply()).toBe(false);
  });
});
