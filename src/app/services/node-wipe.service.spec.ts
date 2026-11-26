import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ControllerError } from './http-controller.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeWipeService } from './node-wipe.service';
import { ProjectService } from './project.service';
import { StartupConfigurationsService } from './startup-configurations.service';
import { ToasterService } from './toaster.service';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';

describe('Node wipe confirmation', () => {
  let dialog: any;
  let configurations: any;
  let projects: any;
  let toaster: any;
  let service: NodeWipeService;
  const nodes = [
    { node_id: 'one', name: 'Router', node_type: 'qemu', status: 'started' },
    { node_id: 'two', name: 'PC', node_type: 'vpcs', status: 'started' },
  ] as Node[];
  beforeEach(() => {
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(true) })) };
    configurations = { wipe: vi.fn(() => of({ nodes: { one: 'wiped', two: 'stop_required' } })) };
    toaster = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    projects = { nodes: vi.fn(() => of(nodes)) };
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: StartupConfigurationsService, useValue: configurations },
        { provide: ToasterService, useValue: toaster },
        { provide: ProjectService, useValue: projects },
      ],
    });
    service = TestBed.inject(NodeWipeService);
  });
  it('does not turn an empty node selection into a project-wide wipe', () => {
    service.confirm({} as Controller, 'project', []).subscribe();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(configurations.wipe).not.toHaveBeenCalled();
  });
  it('skips unsupported node types and says so when nothing is left (all)', () => {
    const unsupported = [{ node_id: 'sw', name: 'Switch', node_type: 'ethernet_switch', status: 'started' }] as Node[];
    projects.nodes.mockReturnValue(of(unsupported));
    service.confirm({} as Controller, 'project', unsupported, true).subscribe();
    expect(toaster.info).toHaveBeenCalledWith(expect.stringContaining('support wiping'));
    expect(dialog.open).not.toHaveBeenCalled();
    expect(configurations.wipe).not.toHaveBeenCalled();
  });
  it('does not erase anything when confirmation is cancelled', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });
    service.confirm({} as Controller, 'project', nodes).subscribe();
    expect(configurations.wipe).not.toHaveBeenCalled();
    expect(toaster.error).not.toHaveBeenCalled();
  });
  it('uses fresh project nodes for a project-wide wipe and reports partial success', () => {
    const controller = {} as Controller;
    const staleSelection = [{ ...nodes[0], node_id: 'stale' }];
    service.confirm(controller, 'project', staleSelection, true).subscribe();
    expect(projects.nodes).toHaveBeenCalledExactlyOnceWith(controller, 'project');
    expect(configurations.wipe).toHaveBeenCalledExactlyOnceWith(controller, 'project', ['one', 'two']);
    expect(toaster.success).toHaveBeenCalledWith('1 node wiped.');
    expect(toaster.error).toHaveBeenCalledWith(
      'PC was not wiped. The node could not be stopped for wiping. Stop it manually, then retry.',
    );
    expect(dialog.open.mock.calls[0][1].data.confirmButtonText).toBe('Wipe all nodes');
  });

  it('confirms a single-node wipe and sends only that node ID', () => {
    service.confirm({} as Controller, 'project', [nodes[0]]).subscribe();
    expect(dialog.open.mock.calls[0][1].data).toMatchObject({
      title: 'Wipe Router?',
      message: 'This node will be reset to a clean state. Your saved configuration sets are kept.',
      note: 'This action cannot be undone.',
      confirmButtonText: 'Wipe node',
      tone: 'danger',
    });
    expect(dialog.open.mock.calls[0][1].data.details).toBeUndefined();
    expect(projects.nodes).not.toHaveBeenCalled();
    expect(configurations.wipe).toHaveBeenCalledExactlyOnceWith({}, 'project', ['one']);
  });

  it('does not wipe when refreshing node status fails', () => {
    projects.nodes.mockReturnValue(throwError(() => new Error('Status unavailable')));
    const failed = vi.fn();
    service.confirm({} as Controller, 'project', nodes, true).subscribe({ error: failed });
    expect(failed).toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(configurations.wipe).not.toHaveBeenCalled();
  });
  it('wipes a multi-selection in one request, skipping unsupported nodes', () => {
    const selection = [
      ...nodes,
      { node_id: 'sw', name: 'Switch', node_type: 'ethernet_switch', status: 'started' },
    ] as Node[];
    configurations.wipe.mockReturnValue(of({ nodes: { one: 'wiped', two: 'wiped' }, stopped: ['one', 'two'] }));
    service.confirm({} as Controller, 'project', selection).subscribe();
    expect(configurations.wipe).toHaveBeenCalledExactlyOnceWith({}, 'project', ['one', 'two']);
    const data = dialog.open.mock.calls[0][1].data;
    expect(data.title).toBe('Wipe 2 nodes?');
    expect(data.confirmButtonText).toBe('Wipe nodes');
    expect(toaster.success).toHaveBeenCalledWith('2 nodes wiped (2 stopped first).');
  });
  it('says a node was stopped when the wipe then failed, and tolerates an empty response', () => {
    configurations.wipe.mockReturnValue(of({ nodes: { one: 'configuration_wipe_failed' }, stopped: ['one'] }));
    service.confirm({} as Controller, 'project', [nodes[0]]).subscribe();
    expect(toaster.error).toHaveBeenCalledWith(
      expect.stringMatching(/^Router was not wiped\. .*The node was stopped\.$/),
    );
    configurations.wipe.mockReturnValue(of(undefined));
    expect(() => service.confirm({} as Controller, 'project', [nodes[0]]).subscribe()).not.toThrow();
  });
  it.each([false, true])('explains a missing wipe endpoint (wrapped: %s)', (wrapped) => {
    const response = new HttpErrorResponse({ status: 404, error: { message: 'Not found' } });
    const error = wrapped ? ControllerError.fromError('Not found', response) : response;
    configurations.wipe.mockReturnValue(throwError(() => error));
    service.wipe({} as Controller, 'project', [nodes[0]]).subscribe();
    expect(toaster.error).toHaveBeenCalledWith(expect.stringContaining('does not support Wipe (404)'));
    expect(toaster.success).not.toHaveBeenCalled();
  });
  it('preserves a specific project-not-found error', () => {
    const error = new HttpErrorResponse({ status: 404, error: { message: 'Project is no longer available' } });
    configurations.wipe.mockReturnValue(throwError(() => error));
    const failed = vi.fn();
    service.confirm({} as Controller, 'project', [nodes[0]]).subscribe({ error: failed });
    expect(failed).toHaveBeenCalledWith(error);
  });
  describe('wipe() entry point', () => {
    it.each([
      [403, 'configuration_access_denied', 'permission'],
      [409, 'configuration_operation_in_progress', 'already running'],
    ])('reports a %s failure as one friendly toast and completes without erroring', (status, message, text) => {
      configurations.wipe.mockReturnValue(throwError(() => new HttpErrorResponse({ status, error: { message } })));
      const failed = vi.fn();
      const completed = vi.fn();
      service.wipe({} as Controller, 'project', [nodes[0]]).subscribe({ error: failed, complete: completed });
      expect(failed).not.toHaveBeenCalled();
      expect(completed).toHaveBeenCalled();
      expect(toaster.error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(text));
    });
  });
});
