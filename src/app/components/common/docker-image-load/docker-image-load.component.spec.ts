import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType } from '@angular/common/http';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DockerImageLoadComponent } from './docker-image-load.component';
import { DockerService } from '@services/docker.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';

describe('DockerImageLoadComponent', () => {
  let component: DockerImageLoadComponent;
  let fixture: ComponentFixture<DockerImageLoadComponent>;
  let mockDockerService: any;
  let mockToasterService: any;
  let controller: Controller;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDockerService = {
      loadImage: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    controller = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      authToken: 'test-token',
    } as Controller;

    await TestBed.configureTestingModule({
      imports: [DockerImageLoadComponent],
      providers: [
        { provide: DockerService, useValue: mockDockerService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DockerImageLoadComponent);
    fixture.componentRef.setInput('controller', controller);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  const selectFile = (name = 'image.tar') => {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [new File(['tar-bytes'], name)] });
    component.onFileSelected({ target: input } as unknown as Event);
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the load button when idle', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Load from tar file');
  });

  it('should keep the icon outside the label so the text stays vertically centred', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.querySelector(':scope > mat-icon')).toBeTruthy();
    expect(button.querySelector('.mdc-button__label mat-icon')).toBeNull();
  });

  it('should ignore a selection without a file', () => {
    const input = document.createElement('input');
    component.onFileSelected({ target: input } as unknown as Event);

    expect(mockDockerService.loadImage).not.toHaveBeenCalled();
    expect(component.loadState()).toBe('idle');
  });

  it('should upload to the local compute and track byte progress', () => {
    const events = new Subject<any>();
    mockDockerService.loadImage.mockReturnValue(events);

    selectFile('package.tar.gz');

    expect(mockDockerService.loadImage).toHaveBeenCalledWith(controller, 'local', expect.any(File));
    expect(component.loadState()).toBe('uploading');

    events.next({ type: HttpEventType.UploadProgress, loaded: 500, total: 1000 });
    expect(component.loadProgress()).toBe(50);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('50%');
  });

  it('should switch to the loading phase once all bytes are transferred', () => {
    const events = new Subject<any>();
    mockDockerService.loadImage.mockReturnValue(events);
    selectFile();

    events.next({ type: HttpEventType.UploadProgress, loaded: 1000, total: 1000 });

    expect(component.loadState()).toBe('loading');

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading into Docker');
  });

  it('should toast success, emit imageLoaded and reset on response', () => {
    const events = new Subject<any>();
    mockDockerService.loadImage.mockReturnValue(events);
    const loaded: string[] = [];
    component.imageLoaded.subscribe((name: string) => loaded.push(name));

    selectFile('package.tar');
    events.next({ type: HttpEventType.Response, body: '' });

    expect(loaded).toEqual(['package.tar']);
    expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'package.tar' loaded");
    expect(component.loadState()).toBe('idle');
  });

  it('should surface the server error and reset to idle', () => {
    const events = new Subject<any>();
    mockDockerService.loadImage.mockReturnValue(events);
    selectFile();

    events.error({ error: { message: 'invalid tar archive' } });

    expect(mockToasterService.error).toHaveBeenCalledWith('invalid tar archive');
    expect(component.loadState()).toBe('idle');
  });

  it('should cancel the in-flight upload and ignore later events', () => {
    const events = new Subject<any>();
    mockDockerService.loadImage.mockReturnValue(events);
    selectFile();
    events.next({ type: HttpEventType.UploadProgress, loaded: 100, total: 1000 });

    component.cancel();

    expect(mockToasterService.warning).toHaveBeenCalledWith('Docker image load cancelled');
    expect(component.loadState()).toBe('idle');

    events.next({ type: HttpEventType.Response, body: '' });
    expect(mockToasterService.success).not.toHaveBeenCalled();
  });

  it('should ignore a new selection while busy', () => {
    const events = new Subject<any>();
    mockDockerService.loadImage.mockReturnValue(events);
    selectFile('first.tar');

    selectFile('second.tar');

    expect(mockDockerService.loadImage).toHaveBeenCalledTimes(1);
    expect(component.loadFileName()).toBe('first.tar');
  });
});
