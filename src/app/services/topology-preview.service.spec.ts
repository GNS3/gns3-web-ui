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
  const otherController = { ...controller, port: 3081 } as Controller;
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
  async function loadOnce(ctrl: Controller = controller, proj: Project = project): Promise<any> {
    const promise = new Promise<any>((resolve, reject) =>
      service.load(ctrl, proj).subscribe({ next: resolve, error: reject })
    );
    await vi.runAllTimersAsync();
    return promise;
  }

  /** Fire-and-forget load with the scheduler flushed. */
  async function loadBackground(ctrl: Controller = controller, proj: Project = project): Promise<void> {
    service.load(ctrl, proj).subscribe();
    await vi.runAllTimersAsync();
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

  it('caches per controller+project — second load does not refetch', async () => {
    await loadOnce();
    await loadOnce();

    expect(mockProjectService.gns3file).toHaveBeenCalledTimes(1);
  });

  it('keys the cache per controller port', async () => {
    await loadOnce();
    await loadOnce(otherController);

    expect(mockProjectService.gns3file).toHaveBeenCalledTimes(2);
  });

  it('evicts failed loads so a retry refetches', async () => {
    mockProjectService.gns3file.mockReturnValueOnce(throwError(() => new Error('boom')));
    await loadOnce().catch(() => undefined);

    // The failed entry must not be replayed.
    await loadOnce();

    expect(mockProjectService.gns3file).toHaveBeenCalledTimes(2);
  });

  it('invalidate(projectId) drops only matching entries', async () => {
    await loadBackground();
    await loadBackground(controller, { project_id: 'proj-2' } as Project);

    service.invalidate('proj-1');

    await loadOnce();
    await loadOnce(controller, { project_id: 'proj-2' } as Project);

    // proj-1 evicted → refetch; proj-2 still cached.
    expect(mockProjectService.gns3file).toHaveBeenCalledTimes(3);
  });

  it('invalidate() clears everything', async () => {
    await loadBackground();

    service.invalidate();

    await loadOnce();

    expect(mockProjectService.gns3file).toHaveBeenCalledTimes(2);
  });

  it('always emits asynchronously, even on a cache hit', async () => {
    await loadOnce();

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
