import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissingImagesDialogService } from './missing-images-dialog.service';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';

describe('MissingImagesDialogService', () => {
  let service: MissingImagesDialogService;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  const controller = { id: 1 } as Controller;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [MissingImagesDialogService, { provide: MatDialog, useValue: mockDialog }],
    });
    service = TestBed.inject(MissingImagesDialogService);
  });

  it('does not open the dialog when no node is missing an image', async () => {
    const result = await firstValueFrom(service.open(controller, [{ node_id: 'n1', missing_image: false } as Node]));

    expect(result).toBeUndefined();
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('opens the dialog for the missing nodes and forwards the result', async () => {
    const dialogResult = { updated: 1, remaining: 0 };
    mockDialog.open.mockReturnValue({ afterClosed: () => of(dialogResult) });

    const missingNode = {
      node_id: 'n1',
      missing_image: true,
      missing_images: [{ property: 'image', image: 'ghost:latest', image_type: 'docker' }],
    } as Node;
    const healthyNode = { node_id: 'n2', missing_image: false } as Node;
    const result = await firstValueFrom(service.open(controller, [missingNode, healthyNode]));

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    const [, config] = mockDialog.open.mock.calls[0];
    expect(config.panelClass).toEqual([
      'base-dialog-panel',
      'dialog-large-panel',
      'missing-images-dialog-panel',
      'missing-images-dialog-panel--project',
    ]);
    expect(config.data.nodes).toEqual([missingNode]);
    expect(result).toEqual(dialogResult);
  });

  it('does not open the dialog when the missing node has no image details', async () => {
    const result = await firstValueFrom(
      service.open(controller, [{ node_id: 'n1', missing_image: true, missing_images: [] } as Node])
    );

    expect(result).toBeUndefined();
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('forwards the title, intro and dismiss button label', async () => {
    mockDialog.open.mockReturnValue({ afterClosed: () => of({ updated: 0, remaining: 1 }) });
    const missingNode = {
      node_id: 'n1',
      missing_image: true,
      missing_images: [{ property: 'image', image: 'ghost:latest', image_type: 'docker' }],
    } as Node;

    await firstValueFrom(
      service.open(controller, [missingNode], {
        title: 'Node missing image',
        introText: 'This node references an image that is not available.',
        dismissButtonText: 'Cancel',
        contentSized: true,
      })
    );

    const [, config] = mockDialog.open.mock.calls[0];
    expect(config.data.title).toBe('Node missing image');
    expect(config.data.introText).toBe('This node references an image that is not available.');
    expect(config.data.dismissButtonText).toBe('Cancel');
    expect(config.panelClass).toContain('missing-images-dialog-panel--content-sized');
  });
});
