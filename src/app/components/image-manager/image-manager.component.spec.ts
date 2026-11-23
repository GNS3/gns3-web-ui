import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageManagerComponent } from './image-manager.component';
import { ControllerService } from '@services/controller.service';
import { DockerService } from '@services/docker.service';
import { ImageManagerService } from '@services/image-manager.service';
import { ImageUploadSessionService } from '@services/image-upload-session.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';
import { MatDialog } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { DockerImage } from '@models/docker/docker-image';
import { PermissionService } from '@services/permission.service';

describe('ImageManagerComponent', () => {
  it('keeps completed uploads until their exact nested path is in the catalog', () => {
    const row = { filename: 'router.qcow2', path: '/images/QEMU/VendorB/router.qcow2', uploadStatus: 'uploaded' };
    const context = {
      images: [{ filename: row.filename, path: '/images/QEMU/VendorA/router.qcow2' }],
      uploadRows: new Map([['upload', row]]),
    };
    const sync = (ImageManagerComponent.prototype as any).syncUploadedRowsWithPersistedData;
    sync.call(context);
    expect(context.uploadRows.size).toBe(1);
    context.images.push({ filename: row.filename, path: row.path });
    sync.call(context);
    expect(context.uploadRows.size).toBe(0);
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have getImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).getImages).toBe('function');
    });

    it('should have onPageEvent method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onPageEvent).toBe('function');
    });

    it('should have onSearchChange method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onSearchChange).toBe('function');
    });

    it('should have list and grid view controls', () => {
      expect(typeof (ImageManagerComponent.prototype as any).toggleView).toBe('function');
    });

    it('should have image detail controls', () => {
      expect(typeof (ImageManagerComponent.prototype as any).selectImage).toBe('function');
      expect(typeof (ImageManagerComponent.prototype as any).closeDetails).toBe('function');
    });

    it('should have filter and sort controls', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onTypeFilterChange).toBe('function');
      expect(typeof (ImageManagerComponent.prototype as any).onSortByChange).toBe('function');
      expect(typeof (ImageManagerComponent.prototype as any).onSortChange).toBe('function');
    });

    it('should have isHighlighted method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isHighlighted).toBe('function');
    });

    it('should have isPersistedRow method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isPersistedRow).toBe('function');
    });

    it('should have hasUploadState method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).hasUploadState).toBe('function');
    });

    it('should have formatImageSize method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).formatImageSize).toBe('function');
    });

    it('should have deleteFile method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).deleteFile).toBe('function');
    });

    it('should have cancelUpload method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).cancelUpload).toBe('function');
    });

    it('should have onRowCheckboxClick method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onRowCheckboxClick).toBe('function');
    });

    it('should have trackByRow method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).trackByRow).toBe('function');
    });

    it('should have isAllSelected method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isAllSelected).toBe('function');
    });

    it('should have selectAllImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).selectAllImages).toBe('function');
    });

    it('should have unChecked method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).unChecked).toBe('function');
    });

    it('should have allChecked method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).allChecked).toBe('function');
    });

    it('should have hasSelection method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).hasSelection).toBe('function');
    });

    it('should have selectedCount method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).selectedCount).toBe('function');
    });

    it('should have installAllImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).installAllImages).toBe('function');
    });

    it('should have pruneImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).pruneImages).toBe('function');
    });

    it('should have addImageDialog method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).addImageDialog).toBe('function');
    });

    it('should have deleteAllFiles method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).deleteAllFiles).toBe('function');
    });

    it('should have isRowSelected method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isRowSelected).toBe('function');
    });
  });

  describe('docker images', () => {
    let component: ImageManagerComponent;
    let fixture: ComponentFixture<ImageManagerComponent>;
    let mockDockerService: any;
    let mockToasterService: any;
    let mockDialog: any;
    let dockerDeletedEvents: Subject<any>;
    let controller: Controller;

    beforeEach(async () => {
      vi.clearAllMocks();

      controller = {
        id: 1,
        name: 'Test Controller',
        host: 'localhost',
        port: 3080,
        protocol: 'http:',
        authToken: 'test-token',
      } as Controller;

      mockDockerService = {
        getImagesForCompute: vi.fn().mockReturnValue(
          of([
            {
              image: 'ubuntu:24.04',
              id: 'sha256:abc',
              size: 131506275,
              created: 1365714795,
            } as DockerImage,
          ])
        ),
        pullImage: vi.fn().mockReturnValue(of(undefined)),
        deleteImage: vi.fn().mockReturnValue(of(undefined)),
        loadImage: vi.fn(),
      };

      mockToasterService = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
      };

      mockDialog = {
        open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
      };

      dockerDeletedEvents = new Subject();

      await TestBed.configureTestingModule({
        imports: [ImageManagerComponent],
        providers: [
          {
            provide: PermissionService,
            useValue: {
              has: () => true,
              hasAny: () => true,
              privileges: () => new Set<string>(['Image.Audit', 'Image.Allocate', 'Compute.Modify']),
              loaded: () => true,
            },
          },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: { get: vi.fn().mockReturnValue('1') } },
              queryParams: of({}),
            },
          },
          { provide: Router, useValue: { navigate: vi.fn() } },
          { provide: ControllerService, useValue: { get: vi.fn().mockResolvedValue(controller) } },
          {
            provide: ImageManagerService,
            useValue: {
              getImages: vi.fn().mockReturnValue(
                of([
                  { filename: 'router1.qcow2', path: '/images/QEMU/router1.qcow2', image_type: 'qemu', availability: 'available' },
                  { filename: 'router2.qcow2', path: '/images/QEMU/router2.qcow2', image_type: 'qemu', availability: 'available' },
                  { filename: 'core1.bin', path: '/images/IOS/core1.bin', image_type: 'ios', availability: 'available' },
                ] as any)
              ),
            },
          },
          { provide: ImageUploadSessionService, useValue: { events$: new Subject() } },
          { provide: DockerService, useValue: mockDockerService },
          { provide: ToasterService, useValue: mockToasterService },
          {
            provide: NotificationService,
            useValue: { dockerImagePullEmitter: new Subject(), dockerImageDeletedEmitter: dockerDeletedEvents },
          },
        ],
      })
        // The standalone component imports MatDialogModule, whose component-level
        // provider wins over TestBed providers; override the token instead.
        .overrideProvider(MatDialog, { useValue: mockDialog })
        .compileComponents();

      fixture = TestBed.createComponent(ImageManagerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    afterEach(() => {
      if (fixture) {
        fixture.destroy();
      }
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should list docker images as rows in the same table as file images', () => {
      expect(mockDockerService.getImagesForCompute).toHaveBeenCalledWith(controller, 'local');
      expect(component.dockerImages()).toEqual([
        { image: 'ubuntu:24.04', id: 'sha256:abc', size: 131506275, created: 1365714795 },
      ]);

      const dockerRow = component.rows().find((row) => row.rowType === 'docker');
      expect(dockerRow?.filename).toBe('ubuntu:24.04');
      expect(dockerRow?.image_type).toBe('docker');
      expect(dockerRow?.image_size).toBe(131506275);

      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('ubuntu:24.04');
    });

    it('should keep the pull button icon in the icon slot so its label stays centred', () => {
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('.image-manager__buttons-bar button')
      ) as HTMLButtonElement[];
      const pullButton = buttons.find((button) => button.textContent?.includes('Pull Docker Image'));
      expect(pullButton).toBeTruthy();
      expect(pullButton!.querySelector(':scope > mat-icon')).toBeTruthy();
      expect(pullButton!.querySelector('.mdc-button__label mat-icon')).toBeNull();
    });

    it('should expose docker in the image type filter', () => {
      expect(component.imageTypes()).toContain('docker');

      component.filterType.set('docker');
      fixture.detectChanges();

      expect(component.filteredRows().every((row) => row.image_type === 'docker')).toBe(true);
    });

    it('should pull the image name returned by the pull dialog and refresh the list', () => {
      mockDockerService.getImagesForCompute.mockReturnValue(of([{ image: 'nginx:latest' } as DockerImage]));
      mockDialog.open.mockReturnValue({ afterClosed: () => of('  nginx:latest  ') });

      component.openPullDockerImageDialog();

      expect(mockDockerService.pullImage).toHaveBeenCalledWith(controller, 'nginx:latest', 'local', expect.any(String));
      expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'nginx:latest' pulled");
      expect(component.dockerPull.isPulling()).toBe(false);
    });

    it('should not pull when the dialog is cancelled', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

      component.openPullDockerImageDialog();

      expect(mockDockerService.pullImage).not.toHaveBeenCalled();
    });

    it('should surface pull failures', () => {
      mockDockerService.pullImage.mockReturnValue(throwError(() => ({ message: 'registry unreachable' })));
      mockDialog.open.mockReturnValue({ afterClosed: () => of('nginx:latest') });

      component.openPullDockerImageDialog();

      expect(mockToasterService.error).toHaveBeenCalledWith('registry unreachable');
      expect(component.dockerPull.isPulling()).toBe(false);
    });

    it('should delete a docker image after confirmation and refresh the list', () => {
      const dockerRow = component.rows().find((row) => row.rowType === 'docker')!;
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

      component.deleteDockerImage(dockerRow);

      expect(mockDockerService.deleteImage).toHaveBeenCalledWith(controller, 'local', 'ubuntu:24.04', false);
      expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'ubuntu:24.04' deleted");
    });

    it('should not delete when the confirmation is declined', () => {
      const dockerRow = component.rows().find((row) => row.rowType === 'docker')!;
      mockDialog.open.mockReturnValue({ afterClosed: () => of(false) });

      component.deleteDockerImage(dockerRow);

      expect(mockDockerService.deleteImage).not.toHaveBeenCalled();
    });

    it('should list referencing templates and retry with force on a template conflict', () => {
      const dockerRow = component.rows().find((row) => row.rowType === 'docker')!;
      mockDockerService.deleteImage
        .mockReturnValueOnce(
          throwError(() => ({
            message: "Image 'ubuntu:24.04' is referenced by template(s): Web Router",
            originalError: {
              status: 409,
              error: {
                message: "Image 'ubuntu:24.04' is referenced by template(s): Web Router",
                code: 'image_referenced_by_templates',
                details: { referenced_by_templates: ['Web Router'] },
              },
            },
          }))
        )
        .mockReturnValue(of(undefined));
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

      component.deleteDockerImage(dockerRow);

      const conflictDialog = mockDialog.open.mock.calls.find(
        (call: any[]) => call[1]?.data?.title === 'Image is used by templates'
      );
      expect(conflictDialog).toBeTruthy();
      expect(conflictDialog![1].data.details).toEqual(['Web Router']);
      expect(mockDockerService.deleteImage).toHaveBeenCalledTimes(2);
      expect(mockDockerService.deleteImage).toHaveBeenLastCalledWith(controller, 'local', 'ubuntu:24.04', true);
      expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'ubuntu:24.04' deleted");
    });

    it('should walk both conflicts: templates first, then the running container', () => {
      const dockerRow = component.rows().find((row) => row.rowType === 'docker')!;
      mockDockerService.deleteImage
        .mockReturnValueOnce(
          throwError(() => ({
            message: 'referenced by template(s)',
            originalError: {
              status: 409,
              error: { code: 'image_referenced_by_templates', details: { referenced_by_templates: ['XRd'] } },
            },
          }))
        )
        .mockReturnValueOnce(
          throwError(() => ({
            message: "it is still used by node 'alpine-1' in project 'lab' (running)",
            originalError: {
              status: 409,
              error: {
                code: 'compute_conflict',
                message: "it is still used by node 'alpine-1' in project 'lab' (running)",
              },
            },
          }))
        )
        .mockReturnValue(of(undefined));
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

      component.deleteDockerImage(dockerRow);

      const titles = mockDialog.open.mock.calls.map((call: any[]) => call[1]?.data?.title);
      expect(titles).toContain('Image is used by templates');
      expect(titles).toContain('Image is in use');
      expect(mockDockerService.deleteImage).toHaveBeenCalledTimes(3);
      expect(mockDockerService.deleteImage).toHaveBeenNthCalledWith(3, controller, 'local', 'ubuntu:24.04', true);
      expect(mockToasterService.success).toHaveBeenCalledWith("Docker image 'ubuntu:24.04' deleted");
    });

    it('should report instead of looping when the same conflict survives a forced retry', () => {
      const dockerRow = component.rows().find((row) => row.rowType === 'docker')!;
      mockDockerService.deleteImage.mockReturnValue(
        throwError(() => ({
          message: "it is still used by node 'alpine-1' in project 'lab' (running)",
          originalError: {
            status: 409,
            error: { code: 'compute_conflict', message: "it is still used by node 'alpine-1' in project 'lab' (running)" },
          },
        }))
      );
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

      component.deleteDockerImage(dockerRow);

      expect(mockDockerService.deleteImage).toHaveBeenCalledTimes(2);
      expect(mockToasterService.error).toHaveBeenCalledWith("it is still used by node 'alpine-1' in project 'lab' (running)");
    });

    it('should refresh the docker list when another client deletes an image', () => {
      const callsBefore = mockDockerService.getImagesForCompute.mock.calls.length;
      dockerDeletedEvents.next({
        action: 'docker.image.deleted',
        event: { compute_id: 'local', image: 'ubuntu:24.04' },
      });
      expect(mockDockerService.getImagesForCompute.mock.calls.length).toBe(callsBefore + 1);
    });

    it('should ignore deletions on remote computes', () => {
      const callsBefore = mockDockerService.getImagesForCompute.mock.calls.length;
      dockerDeletedEvents.next({
        action: 'docker.image.deleted',
        event: { compute_id: 'remote', image: 'ubuntu:24.04' },
      });
      expect(mockDockerService.getImagesForCompute.mock.calls.length).toBe(callsBefore);
    });

    describe('select all with filters', () => {
      it('selects only the images matching the type and search filters', () => {
        component.filterType.set('qemu');
        component.searchText.set('router');
        fixture.detectChanges();

        component.selectAllImages();
        fixture.detectChanges();

        expect(Array.from(component.selectedPaths).sort()).toEqual([
          '/images/QEMU/router1.qcow2',
          '/images/QEMU/router2.qcow2',
        ]);
      });

      it('selects all filtered docker images from the header checkbox', () => {
        mockDockerService.getImagesForCompute.mockReturnValue(
          of([
            { image: 'debian:latest' } as DockerImage,
            { image: 'deno:latest' } as DockerImage,
            { image: 'ubuntu:24.04' } as DockerImage,
          ])
        );
        component.getDockerImages();
        fixture.detectChanges();

        // The user's case: type = docker + name search "de".
        component.filterType.set('docker');
        component.searchText.set('de');
        fixture.detectChanges();

        expect(component.filteredRows().map((row) => row.filename)).toEqual(['debian:latest', 'deno:latest']);

        component.selectAllImages();
        fixture.detectChanges();

        expect(Array.from(component.selectedPaths).sort()).toEqual(['docker:debian:latest', 'docker:deno:latest']);
        const inputs = Array.from(
          fixture.nativeElement.querySelectorAll(
            '.image-manager__table-container mat-row input[type="checkbox"]'
          )
        ) as HTMLInputElement[];
        expect(inputs.filter((input) => input.checked).length).toBe(2);
      });

      it('renders the filtered rows as checked', () => {
        component.filterType.set('qemu');
        fixture.detectChanges();

        component.selectAllImages();
        fixture.detectChanges();

        const inputs = Array.from(
          fixture.nativeElement.querySelectorAll(
            '.image-manager__table-container mat-row input[type="checkbox"]'
          )
        ) as HTMLInputElement[];
        expect(inputs.filter((input) => input.checked).length).toBe(2);
        const headerInput = fixture.nativeElement.querySelector(
          'mat-header-row input[type="checkbox"]'
        ) as HTMLInputElement;
        expect(headerInput.checked).toBe(true);
      });
    });

    it('should highlight only the docker row opened in details, not every docker row', () => {
      mockDockerService.getImagesForCompute.mockReturnValue(
        of([{ image: 'debian:latest' } as DockerImage, { image: 'ubuntu:24.04' } as DockerImage])
      );
      component.getDockerImages();
      fixture.detectChanges();

      const debianRow = component.rows().find((row) => row.filename === 'debian:latest')!;
      component.selectImage(debianRow);
      fixture.detectChanges();

      const selectedRows = fixture.nativeElement.querySelectorAll('.image-manager__row--selected');
      expect(selectedRows.length).toBe(1);
      expect(selectedRows[0].textContent).toContain('debian:latest');
    });

    it('should render tar load progress in its own row below the actions', () => {
      const events = new Subject<any>();
      mockDockerService.loadImage.mockReturnValue(events);
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [new File(['tar'], 'iol-xe.tar.gz')] });

      component.onDockerLoadFileSelected({ target: input } as unknown as Event);
      events.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
      fixture.detectChanges();

      expect(mockDockerService.loadImage).toHaveBeenCalledWith(controller, 'local', expect.any(File));
      const row = fixture.nativeElement.querySelector('.image-manager__docker-job');
      expect(row).toBeTruthy();
      expect(row.textContent).toContain('iol-xe.tar.gz');
      expect(row.textContent).toContain('50%');
      // The progress row must not live inside the buttons bar.
      expect(fixture.nativeElement.querySelector('.image-manager__buttons-bar .image-manager__docker-job')).toBeNull();
    });

    it('should refresh docker images when the archive finished loading', () => {
      const events = new Subject<any>();
      mockDockerService.loadImage.mockReturnValue(events);
      const callsBefore = mockDockerService.getImagesForCompute.mock.calls.length;
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [new File(['tar'], 'image.tar')] });

      component.onDockerLoadFileSelected({ target: input } as unknown as Event);
      events.next({ type: HttpEventType.Response, body: '' });

      expect(mockDockerService.getImagesForCompute.mock.calls.length).toBe(callsBefore + 1);
      expect(component.dockerLoad.isBusy()).toBe(false);
    });
  });
});
