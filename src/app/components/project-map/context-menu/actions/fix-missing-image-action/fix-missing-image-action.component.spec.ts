import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FixMissingImageActionComponent } from './fix-missing-image-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { MissingImagesDialogService } from '@components/projects/missing-images-dialog/missing-images-dialog.service';
import { ToasterService } from '@services/toaster.service';

describe('FixMissingImageActionComponent', () => {
  let component: FixMissingImageActionComponent;
  let fixture: ComponentFixture<FixMissingImageActionComponent>;
  let mockMissingImagesDialog: { open: ReturnType<typeof vi.fn> };
  let mockToasterService: { success: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  const controller = { id: 1 } as Controller;
  const node = {
    node_id: 'n1',
    name: 'R1',
    missing_image: true,
    missing_images: [{ property: 'hda_disk_image', image: 'missing.qcow2', image_type: 'qemu' }],
  } as Node;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockMissingImagesDialog = { open: vi.fn().mockReturnValue(of(undefined)) };
    mockToasterService = { success: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FixMissingImageActionComponent],
      providers: [
        { provide: MissingImagesDialogService, useValue: mockMissingImagesDialog },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FixMissingImageActionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controller', controller);
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('opens the dialog with the node-specific title, intro and cancel label', () => {
    component.fixMissingImage();

    expect(mockMissingImagesDialog.open).toHaveBeenCalledTimes(1);
    const [passedController, passedNodes, options] = mockMissingImagesDialog.open.mock.calls[0];
    expect(passedController).toBe(controller);
    expect(passedNodes).toEqual([node]);
    expect(options.title).toBe('Node missing image');
    expect(options.introText).toContain('This node references an image that is not available.');
    expect(options.dismissButtonText).toBe('Cancel');
    expect(options.contentSized).toBe(true);
  });

  it('toasts success when a replacement was applied', () => {
    mockMissingImagesDialog.open.mockReturnValue(of({ updated: 1, remaining: 0 }));

    component.fixMissingImage();

    expect(mockToasterService.success).toHaveBeenCalledWith('Image updated for R1.');
    expect(mockToasterService.warning).not.toHaveBeenCalled();
  });

  it('warns when some images are still missing', () => {
    mockMissingImagesDialog.open.mockReturnValue(of({ updated: 1, remaining: 1 }));

    component.fixMissingImage();

    expect(mockToasterService.warning).toHaveBeenCalled();
  });
});
