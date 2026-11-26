import { TestBed } from '@angular/core/testing';
import { Controller } from '@models/controller';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Node } from '../cartography/models/node';
import { HttpController } from './http-controller.service';
import { ConfigurationJob, StartupDocument } from '@models/startup-configuration';
import {
  bytesToBase64Url,
  configurationExportFileName,
  configurationExportRequest,
  StartupConfigurationsService,
} from './startup-configurations.service';

const controller = { id: 1 } as Controller;
const setA = '00000000-0000-0000-0000-000000000000';
const setB = '00000000-0000-0000-0000-00000000000b';
const node = (overrides: Partial<Node> = {}) =>
  ({
    node_id: 'node-1',
    project_id: 'project-1',
    name: 'R1',
    node_type: 'qemu',
    status: 'started',
    properties: {},
    ...overrides,
  }) as Node;
const readBody = (body: Blob) =>
  new Promise<any>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(reader.result as string));
    reader.readAsText(body);
  });

describe('Configuration export request', () => {
  it('forwards console options for non-Docker nodes', () => {
    expect(configurationExportRequest(node(), { device_type: 'cisco_asa' })).toEqual({
      device_type: 'cisco_asa',
    });
  });
  it.each([
    ['', 'started', { source: 'saved_files' }],
    ['GNS3_IOL_RUNNER=1', 'stopped', { source: 'saved_startup' }],
    ['GNS3_IOL_RUNNER=1', 'started', { source: 'running', device_type: 'cisco_ios_telnet' }],
  ])('maps a Docker node (%j, %s) to its fixed source', (environment, status, expected) => {
    const docker = node({ node_type: 'docker', status, properties: { environment } as any });
    expect(configurationExportRequest(docker, { device_type: 'cisco_asa' })).toEqual(expected);
  });
  it('builds a safe fallback file name', () => {
    expect(configurationExportFileName(node({ name: 'Router/one', node_type: 'vpcs' }), {}, new Blob())).toBe(
      'Router_one_configuration.vpc',
    );
    expect(
      configurationExportFileName(node(), { device_type: 'mikrotik_routeros' }, new Blob([], { type: 'text/plain' })),
    ).toBe('R1_configuration.rsc');
    expect(
      configurationExportFileName(node(), { device_type: 'paloalto_panos' }, new Blob([], { type: 'text/plain' })),
    ).toBe('R1_configuration.xml');
    expect(configurationExportFileName(node(), {}, new Blob([], { type: 'application/zip' }))).toBe(
      'R1_configuration.zip',
    );
    expect(configurationExportFileName(node({ name: 'CON' }), {}, new Blob())).toBe('_CON_configuration.cfg');
  });
});

describe('bytesToBase64Url', () => {
  it('encodes with the URL-safe alphabet and without being limited by call-stack size', () => {
    expect(bytesToBase64Url(new Uint8Array([251, 255, 190]))).toBe('-_--');
    const big = new Uint8Array(300000).fill(65);
    expect(atob(bytesToBase64Url(big).replace(/-/g, '+').replace(/_/g, '/')).length).toBe(300000);
  });
});

describe('StartupConfigurationsService', () => {
  let http: any;
  let service: StartupConfigurationsService;
  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      postBlob: vi.fn(),
      getBlob: vi.fn(),
    };
    TestBed.configureTestingModule({ providers: [{ provide: HttpController, useValue: http }] });
    service = TestBed.inject(StartupConfigurationsService);
  });

  describe('exportConfiguration', () => {
    const respond = () => new Blob(['hostname R1']);

    it('posts the options as a JSON body', async () => {
      vi.useRealTimers(); // FileReader needs real timers
      http.postBlob.mockReturnValue(of(respond()));
      await new Promise<void>((resolve) =>
        service.exportConfiguration(controller, node(), { device_type: 'cisco_asa' }).subscribe({ complete: resolve }),
      );
      const [, path, body] = http.postBlob.mock.calls[0];
      expect(path).toBe('/projects/project-1/nodes/node-1/configuration-export');
      expect(body.type).toBe('application/json');
      expect(await readBody(body)).toEqual({ device_type: 'cisco_asa' });
    });

    it('passes the request source through for IOU', async () => {
      vi.useRealTimers(); // FileReader needs real timers
      http.postBlob.mockReturnValue(of(respond()));
      const options = {
        source: 'saved_startup' as const,
      };
      service.exportConfiguration(controller, node({ node_type: 'iou' }), options).subscribe();
      expect(await readBody(http.postBlob.mock.calls[0][2])).toEqual(options);
    });

    it('lets a 403 configuration_access_denied reach the caller unchanged', () => {
      const denied = { status: 403, error: { message: 'configuration_access_denied' } };
      http.postBlob.mockReturnValue(throwError(() => denied));
      const failed = vi.fn();
      service.exportConfiguration(controller, node()).subscribe({ error: failed });
      expect(failed).toHaveBeenCalledWith(denied);
    });
  });

  describe('set archives', () => {
    it('downloads a set as a ZIP from the set export endpoint', () => {
      const zip = new Blob(['zip']);
      http.getBlob.mockReturnValue(of(zip));
      let result: Blob | undefined;
      service.exportSet(controller, 'project-1', setB, 7).subscribe((value) => (result = value));
      expect(http.getBlob).toHaveBeenCalledWith(
        controller,
        `/projects/project-1/startup-configurations/sets/${setB}/export?revision=7`,
      );
      expect(result).toBe(zip);
    });

    it('imports an archive as a NEW named set without selecting or assigning it', () => {
      http.post.mockReturnValue(of({ set: { id: 'x', name: 'Imported' }, skipped: [], warnings: [] }));
      service.importSet(controller, 'project-1', new Uint8Array([251, 255, 190]), 'Imported').subscribe();
      expect(http.post).toHaveBeenCalledWith(controller, '/projects/project-1/startup-configurations/import', {
        archive: '-_--',
        name: 'Imported',
        select: false,
        assign_nodes: false,
      });
    });
  });

  describe('unknown keys', () => {
    const withExtras = {
      version: 1,
      revision: 3,
      selected: setA,
      unknown_top: 'x',
      selection_revision: 2,
      selections: { 'node-1': { kind: 'set', set_id: setA, profile: 'old' }, 'node-2': { kind: 'none', set_id: null } },
      sets: [
        {
          id: setA,
          name: 'Default',
          unknown_set: 'b',
          nodes: {
            'node-1': {
              device_type: 'cisco_ios_telnet',
              content: 'hostname R1',
              enabled: true,
              files: [],
              unknown_entry: {},
            },
          },
        },
      ],
    };
    const clean = {
      version: 1,
      revision: 3,
      selected: setA,
      selection_revision: 2,
      selections: { 'node-1': { kind: 'set', set_id: setA }, 'node-2': { kind: 'none' } },
      sets: [
        {
          id: setA,
          name: 'Default',
          nodes: { 'node-1': { device_type: 'cisco_ios_telnet', content: 'hostname R1', enabled: true } },
        },
      ],
    };
    it('ignores unknown keys when reading the document', () => {
      http.get.mockReturnValue(of(withExtras));
      let result: any;
      service.get(controller, 'project-1').subscribe((document) => (result = document));
      expect(result).toEqual(clean);
    });
    it('never sends unknown keys back when saving', () => {
      http.put.mockImplementation((_c, _p, body) => of(body));
      service.save(controller, 'project-1', withExtras as any).subscribe();
      expect(http.put.mock.calls[0][2]).toEqual(clean);
    });
  });

  describe('selection actions', () => {
    it('adds a set without making it the default', () => {
      service.createSet(controller, 'p', 'Lab', 4);
      expect(http.post).toHaveBeenCalledWith(controller, '/projects/p/startup-configurations/sets', {
        name: 'Lab',
        revision: 4,
        select: false,
      });
    });

    it('puts one choice for several nodes', () => {
      service.assignSelection(controller, 'p', ['a', 'b'], { kind: 'none' }, 2);
      expect(http.put).toHaveBeenCalledWith(controller, '/projects/p/startup-configurations/selections', {
        node_ids: ['a', 'b'],
        selection: { kind: 'none' },
        revision: 2,
      });
    });
  });

  describe('wipe', () => {
    it('posts explicit node ids', () => {
      http.post.mockReturnValue(of({ nodes: {} }));
      service.wipe(controller, 'project-1', ['a', 'b']).subscribe();
      expect(http.post).toHaveBeenCalledWith(controller, '/projects/project-1/startup-configurations/wipe', {
        node_ids: ['a', 'b'],
      });
    });
  });

  describe('waitForJob', () => {
    const job = (overrides: Partial<ConfigurationJob> = {}): ConfigurationJob => ({
      id: 'job-1',
      set_id: setA,
      operation: 'capture',
      status: 'running',
      nodes: {},
      ...overrides,
    });

    it('returns an already finished job without polling', () => {
      const finished = job({ status: 'finished' });
      let result: any;
      service.waitForJob(controller, 'project-1', finished).subscribe((value) => (result = value));
      expect(result).toBe(finished);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('polls once a second and completes when the job leaves the running state', async () => {
      const statuses = [
        { jobs: [job()] },
        { jobs: [job({ id: 'other', status: 'finished' })] },
        { jobs: [job({ status: 'finished', nodes: { n: 'captured' } })] },
      ];
      http.get.mockImplementation(() => of(statuses.shift()));
      const next = vi.fn();
      service.waitForJob(controller, 'project-1', job()).subscribe(next);
      await vi.advanceTimersByTimeAsync(0);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1000);
      expect(next).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1000);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 'finished', nodes: { n: 'captured' } }));
      await vi.advanceTimersByTimeAsync(5000);
      expect(http.get).toHaveBeenCalledTimes(3);
    });

    it.each([
      ['capture', 90000, undefined],
      ['apply', 200000, undefined],
      ['capture', 3000, 3000],
    ])('times out a %s job after %i ms (explicit deadline: %s)', async (operation, deadline, explicit) => {
      http.get.mockReturnValue(of({ jobs: [job({ operation })] }));
      const failed = vi.fn();
      service.waitForJob(controller, 'project-1', job({ operation }), explicit).subscribe({ error: failed });
      await vi.advanceTimersByTimeAsync(deadline - 1);
      expect(failed).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(failed).toHaveBeenCalledWith(new Error('configuration_job_still_running'));
    });
  });

  describe('captureNode', () => {
    it('reloads the document when the node was captured, otherwise raises the reason code', () => {
      const document = { version: 1, revision: 5, selected: setA, sets: [] } as StartupDocument;
      http.post.mockReturnValue(
        of({ id: 'j', status: 'finished', operation: 'capture', nodes: { 'node-1': 'captured' } }),
      );
      http.get.mockReturnValue(of(document));
      let result: any;
      service.captureNode(controller, node(), setA).subscribe((value) => (result = value));
      expect(http.post).toHaveBeenCalledWith(controller, '/projects/project-1/startup-configurations/capture', {
        set_id: setA,
        node_ids: ['node-1'],
      });
      expect(result).toEqual(document);

      http.post.mockReturnValue(
        of({ id: 'j', status: 'finished', operation: 'capture', nodes: { 'node-1': 'console_busy' } }),
      );
      const failed = vi.fn();
      service.captureNode(controller, node(), setA).subscribe({ error: failed });
      expect(failed.mock.calls[0][0].message).toBe('console_busy');
    });
  });
});
