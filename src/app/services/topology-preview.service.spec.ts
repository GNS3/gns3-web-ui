import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TopologyPreviewService } from './topology-preview.service';
import { ProjectService } from './project.service';
import { NodeSymbolResolverService } from './node-symbol-resolver.service';
import { Gns3ProjectFile } from '../models/gns3-file';
import { Controller } from '@models/controller';
import { Project } from '@models/project';

// The test setup installs fake timers and the service subscribes on the
// asyncScheduler (so the loading → ready transition always renders) — every
// load must be drained with runAllTimersAsync.
describe('TopologyPreviewService', () => {
  let service: TopologyPreviewService;
  let mockProjectService: any;
  let mockResolver: any;

  const controller = {
    id: 1,
    authToken: '',
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  } as Controller;
  const project = { project_id: 'proj-1' } as Project;

  const file: Gns3ProjectFile = {
    project_id: 'proj-1',
    topology: {
      nodes: [{ node_id: 'node-1', name: 'R1', symbol: ':/symbols/router.svg' }],
      links: [],
      drawings: [],
    },
  };

  /** Subscribe, flush the asyncScheduler timer, and resolve with the emission. */
  async function loadOnce(): Promise<any> {
    const promise = new Promise<any>((resolve, reject) =>
      service.load(controller, project).subscribe({ next: resolve, error: reject })
    );
    await vi.runAllTimersAsync();
    return promise;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockProjectService = {
      gns3file: vi.fn().mockReturnValue(of(file)),
    };
    // Identity resolver that marks the nodes as resolved.
    mockResolver = {
      resolve: vi.fn((_: Controller, nodes: any[]) => of(nodes.map((n) => ({ ...n, symbol_url: 'blob:x' })))),
    };

    TestBed.configureTestingModule({
      providers: [
        TopologyPreviewService,
        { provide: ProjectService, useValue: mockProjectService },
        { provide: NodeSymbolResolverService, useValue: mockResolver },
      ],
    });
    service = TestBed.inject(TopologyPreviewService);
  });

  it('maps the file and resolves symbols before emitting', async () => {
    const result = await loadOnce();

    expect(mockProjectService.gns3file).toHaveBeenCalledWith(controller, 'proj-1');
    expect(mockResolver.resolve).toHaveBeenCalledWith(controller, expect.anything());
    expect(result.nodes[0].node_id).toBe('node-1');
    expect(result.nodes[0].symbol_url).toBe('blob:x');
    expect(result.nodes[0].project_id).toBe('proj-1');
  });

  it('propagates load errors to the consumer', async () => {
    mockProjectService.gns3file.mockReturnValueOnce(throwError(() => new Error('boom')));

    // Handler attached at subscribe time — a later `.rejects` would miss the
    // fake-timer flush window and surface as an unhandled rejection.
    const outcome = new Promise<unknown>((resolve) => {
      service.load(controller, project).subscribe({
        next: (value) => resolve(value),
        error: (err) => resolve(err),
      });
    });
    const result = await vi.runAllTimersAsync().then(() => outcome);

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe('boom');
  });

  it('always emits asynchronously', async () => {
    let emitted = false;
    service.load(controller, project).subscribe(() => {
      emitted = true;
    });
    // Before the scheduler fires, the loading state must still be observable.
    expect(emitted).toBe(false);
    await vi.runAllTimersAsync();
    expect(emitted).toBe(true);
  });
});
