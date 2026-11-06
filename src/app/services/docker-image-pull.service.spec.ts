import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DockerImagePullService } from './docker-image-pull.service';
import { DockerService } from './docker.service';
import { NotificationService } from './notification.service';
import { ToasterService } from './toaster.service';
import { Controller } from '@models/controller';
import { DockerImagePullEvent, DockerImagePullNotification } from '@models/docker/docker-image';

describe('DockerImagePullService', () => {
  let service: DockerImagePullService;
  let pullEvents: Subject<DockerImagePullNotification>;
  let pullRequest: Subject<void>;
  let mockDockerService: any;
  let mockToasterService: any;
  let controller: Controller;

  beforeEach(() => {
    vi.clearAllMocks();

    pullEvents = new Subject<DockerImagePullNotification>();
    pullRequest = new Subject<void>();
    mockDockerService = {
      pullImage: vi.fn().mockReturnValue(pullRequest),
    };
    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DockerImagePullService,
        { provide: DockerService, useValue: mockDockerService },
        { provide: NotificationService, useValue: { dockerImagePullEmitter: pullEvents } },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    });
    service = TestBed.inject(DockerImagePullService);

    controller = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      authToken: 'test-token',
    } as Controller;
  });

  const startedPullProgressId = (): string => mockDockerService.pullImage.mock.calls[0][3];

  const emitPull = (progressId: string, overrides: Partial<DockerImagePullEvent> = {}): void => {
    pullEvents.next({
      action: 'docker.image.pull',
      event: {
        compute_id: 'local',
        progress_id: progressId,
        image: 'debian',
        state: 'started',
        ...overrides,
      },
    });
  };

  it('starts queued and sends a progress id with the pull request', () => {
    service.start(controller, 'debian');

    expect(service.phase()).toBe('queued');
    expect(service.isPulling()).toBe(true);
    expect(service.statusLabel()).toBe('Queued…');
    expect(mockDockerService.pullImage).toHaveBeenCalledWith(controller, 'debian', 'local', expect.any(String));
  });

  it('moves to downloading on the started event', () => {
    service.start(controller, 'debian');

    emitPull(startedPullProgressId());

    expect(service.phase()).toBe('downloading');
    expect(service.progressPercent()).toBeNull();
    expect(service.statusLabel()).toBe('Downloading…');
  });

  it('tracks per-layer progress from downloading events', () => {
    service.start(controller, 'debian');

    emitPull(startedPullProgressId(), {
      state: 'downloading',
      layers_total: 4,
      layers_done: 1,
      message: 'Downloading [==>   ] 40/100',
    });

    expect(service.layersDone()).toBe(1);
    expect(service.layersTotal()).toBe(4);
    expect(service.progressPercent()).toBe(25);
    expect(service.statusLabel()).toBe('1 / 4 layers');
    expect(service.message()).toBe('Downloading [==>   ] 40/100');
  });

  it('ignores events that belong to another pull', () => {
    service.start(controller, 'debian');

    emitPull('another-progress-id', { state: 'completed' });

    expect(service.isPulling()).toBe(true);
    expect(mockToasterService.success).not.toHaveBeenCalled();
  });

  it('ignores events for another compute', () => {
    service.start(controller, 'debian');

    emitPull(startedPullProgressId(), { compute_id: 'remote-compute', state: 'completed' });

    expect(service.isPulling()).toBe(true);
    expect(mockToasterService.success).not.toHaveBeenCalled();
  });

  it('completes once and emits the image name', () => {
    const completed: string[] = [];
    service.completed.subscribe((image) => completed.push(image));
    service.start(controller, 'debian');

    emitPull(startedPullProgressId(), { state: 'completed' });
    // A late HTTP response must not report the same pull twice.
    pullRequest.next();

    expect(service.isPulling()).toBe(false);
    expect(completed).toEqual(['debian']);
    expect(mockToasterService.success).toHaveBeenCalledTimes(1);
    expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'debian' pulled");
  });

  it('reports a failed event once even when the request then errors', () => {
    service.start(controller, 'debian');

    emitPull(startedPullProgressId(), { state: 'failed', message: 'no such image: debian' });
    pullRequest.error({ message: 'no such image: debian' });

    expect(mockToasterService.error).toHaveBeenCalledTimes(1);
    expect(mockToasterService.error).toHaveBeenCalledWith('no such image: debian');
    expect(service.isPulling()).toBe(false);
  });

  it('falls back to the request outcome when no event arrives', () => {
    service.start(controller, 'debian');

    pullRequest.next();

    expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'debian' pulled");
    expect(service.isPulling()).toBe(false);
  });

  it('does not start a second pull while one is running', () => {
    service.start(controller, 'debian');
    service.start(controller, 'ubuntu');

    expect(mockDockerService.pullImage).toHaveBeenCalledTimes(1);
    expect(service.imageName()).toBe('debian');
  });
});
