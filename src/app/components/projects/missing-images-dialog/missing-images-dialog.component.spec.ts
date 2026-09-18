import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MissingImagesDialogComponent } from './missing-images-dialog.component';
import { DockerService } from '@services/docker.service';
import { ImageManagerService } from '@services/image-manager.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../cartography/models/node';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Controller } from '@models/controller';

describe('MissingImagesDialogComponent', () => {
  let component: MissingImagesDialogComponent;
  let fixture: ComponentFixture<MissingImagesDialogComponent>;
  let mockDialogRef: any;
  let mockImageManagerService: any;
  let mockDockerService: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockNodesDataSource: any;

  const controller = { id: 1, name: 'c', protocol: 'http:', host: 'localhost', port: 3080 } as Controller;

  const createNode = (missingImages: any[], missingImage = true): Node =>
    ({
      node_id: 'n1',
      name: 'R1',
      node_type: 'qemu',
      status: 'stopped',
      project_id: 'p1',
      properties: { hda_disk_image: 'missing.qcow2' },
      missing_image: missingImage,
      missing_images: missingImages,
    } as Node);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };
    mockImageManagerService = {
      getImages: vi.fn().mockReturnValue(
        of([
          { filename: 'good.qcow2', path: '/home/user/GNS3/images/QEMU/Cisco/good.qcow2', image_type: 'qemu' },
          { filename: 'router.image', image_type: 'ios' },
          { filename: 'iou.bin', image_type: 'iou' },
        ])
      ),
    };
    mockDockerService = {
      getImages: vi.fn().mockReturnValue(of([{ image: 'ubuntu:latest' }])),
      getImagesForCompute: vi.fn().mockReturnValue(of([{ image: 'ubuntu:latest' }])),
    };
    mockNodeService = {
      updateNode: vi.fn().mockImplementation((_controller, node) => of({ ...node, missing_image: false })),
    };
    mockToasterService = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    mockNodesDataSource = { update: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MissingImagesDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            controller,
            nodes: [createNode([{ property: 'hda_disk_image', image: 'missing.qcow2', image_type: 'qemu' }])],
          },
        },
        { provide: ImageManagerService, useValue: mockImageManagerService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MissingImagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('uses portable filenames instead of controller-local image paths', () => {
    const groups = component.groups();
    expect(groups.length).toBe(1);
    expect(groups[0].node.name).toBe('R1');
    expect(groups[0].rows.length).toBe(1);
    expect(groups[0].rows[0].propertyLabel).toBe('Hard disk (HDA)');
    expect(groups[0].rows[0].options).toEqual(['good.qcow2']);
  });

  it('uses the replacement label and prompt for emulator images', () => {
    const formField = fixture.nativeElement.querySelector('mat-form-field');
    expect(formField.textContent).toContain('Replacement image');
    expect(formField.textContent).toContain('Choose replacement image');
    expect(fixture.nativeElement.textContent).not.toContain('Keep missing');
  });

  it('uses the default dismiss button label', () => {
    expect(component.dismissButtonText).toBe('Open project without fixing');
  });

  it('uses a custom dismiss button label when provided', () => {
    component.data.dismissButtonText = 'Cancel';
    expect(component.dismissButtonText).toBe('Cancel');
  });

  it('uses the project title and intro by default', () => {
    expect(component.title).toBe('Project missing images');
    expect(component.introText).toContain('This project references images that are not available.');
  });

  it('uses a custom title and intro when provided', () => {
    component.data.title = 'Node missing image';
    component.data.introText = 'This node references an image that is not available.';

    expect(component.title).toBe('Node missing image');
    expect(component.introText).toBe('This node references an image that is not available.');
  });

  it('reports no compatible image when the image manager has none of the type', async () => {
    mockImageManagerService.getImages.mockReturnValue(of([{ filename: 'router.image', image_type: 'ios' }]));
    fixture = TestBed.createComponent(MissingImagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.groups()[0].rows[0].options).toEqual([]);
  });

  it('does not report changes until a replacement is selected', () => {
    expect(component.hasChanges()).toBe(false);

    component.onSelectionChange(component.groups()[0].rows[0].key, 'good.qcow2');

    expect(component.hasChanges()).toBe(true);
  });

  it('applies the selected replacement and closes with the updated count', () => {
    component.onSelectionChange(component.groups()[0].rows[0].key, 'good.qcow2');
    component.applyChanges();

    expect(mockNodeService.updateNode).toHaveBeenCalledTimes(1);
    const updatedNode = mockNodeService.updateNode.mock.calls[0][1] as Node;
    expect(updatedNode.properties['hda_disk_image']).toBe('good.qcow2');
    expect(mockNodesDataSource.update).toHaveBeenCalledWith(expect.objectContaining({ missing_image: false }));
    expect(mockDialogRef.close).toHaveBeenCalledWith({ updated: 1, remaining: 0 });
  });

  it('closes with a still-missing count when nothing is selected', () => {
    component.applyChanges();
    expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ updated: 0, remaining: 1 });
  });

  it('keeps the node degraded when the update fails', () => {
    mockNodeService.updateNode.mockReturnValue(throwError(() => ({ error: { message: 'boom' } })));
    component.onSelectionChange(component.groups()[0].rows[0].key, 'good.qcow2');
    component.applyChanges();

    expect(mockToasterService.error).toHaveBeenCalledWith('boom');
    expect(mockDialogRef.close).toHaveBeenCalledWith({ updated: 0, remaining: 1 });
  });

  it('uses the server response when only some images on a node are replaced', () => {
    const group = component.groups()[0];
    const secondRow = {
      ...group.rows[0],
      key: 'n1::cdrom_image::1',
      property: 'cdrom_image',
      propertyLabel: 'CD-ROM',
      image: 'missing.iso',
    };
    component.groups.set([{ ...group, rows: [...group.rows, secondRow] }]);
    mockNodeService.updateNode.mockReturnValue(
      of({
        ...group.node,
        missing_image: true,
        missing_images: [{ property: 'cdrom_image', image: 'missing.iso', image_type: 'qemu' }],
      })
    );

    component.onSelectionChange(group.rows[0].key, 'good.qcow2');
    component.applyChanges();

    expect(mockDialogRef.close).toHaveBeenCalledWith({ updated: 1, remaining: 1 });
  });

  it('loads docker images when a docker node is missing an image', () => {
    TestBed.resetTestingModule();
    mockImageManagerService.getImages.mockClear();
    mockDockerService.getImagesForCompute.mockImplementation((_controller, computeId) =>
      of([{ image: computeId === 'local' ? 'ubuntu:latest' : 'alpine:latest' }])
    );
    TestBed.configureTestingModule({
      imports: [MissingImagesDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            controller,
            nodes: [
              {
                ...createNode([{ property: 'image', image: 'missing:latest', image_type: 'docker' }]),
                node_type: 'docker',
                compute_id: 'local',
              },
              {
                ...createNode([{ property: 'image', image: 'other:latest', image_type: 'docker' }]),
                node_id: 'n2',
                name: 'R2',
                node_type: 'docker',
                compute_id: 'remote',
              },
            ],
          },
        },
        { provide: ImageManagerService, useValue: mockImageManagerService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
      ],
    }).compileComponents();

    const dockerFixture = TestBed.createComponent(MissingImagesDialogComponent);
    dockerFixture.detectChanges();

    expect(mockDockerService.getImagesForCompute).toHaveBeenCalledWith(controller, 'local');
    expect(mockDockerService.getImagesForCompute).toHaveBeenCalledWith(controller, 'remote');
    expect(mockImageManagerService.getImages).not.toHaveBeenCalled();
    expect(dockerFixture.componentInstance.groups()[0].rows[0].options).toEqual(['ubuntu:latest']);
    expect(dockerFixture.componentInstance.groups()[1].rows[0].options).toEqual(['alpine:latest']);
    expect(dockerFixture.componentInstance.groups()[0].rows[0].isDocker).toBe(true);
    const formField = dockerFixture.nativeElement.querySelector('mat-form-field');
    const input = dockerFixture.nativeElement.querySelector('input');
    expect(formField.textContent).toContain('Replacement image');
    expect(input.placeholder).toBe('Choose replacement image');
    dockerFixture.destroy();
  });

  it('accepts a typed Docker image reference', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MissingImagesDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            controller,
            nodes: [
              {
                ...createNode([{ property: 'image', image: 'missing:latest', image_type: 'docker' }]),
                node_type: 'docker',
                compute_id: 'local',
              },
            ],
          },
        },
        { provide: ImageManagerService, useValue: mockImageManagerService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
      ],
    }).compileComponents();

    const dockerFixture = TestBed.createComponent(MissingImagesDialogComponent);
    dockerFixture.detectChanges();
    const key = dockerFixture.componentInstance.groups()[0].rows[0].key;

    dockerFixture.componentInstance.onDockerInput(key, 'alpine:3.20');
    expect(dockerFixture.componentInstance.hasChanges()).toBe(true);

    dockerFixture.componentInstance.applyChanges();

    const updatedNode = mockNodeService.updateNode.mock.calls[0][1] as Node;
    expect(updatedNode.properties['image']).toBe('alpine:3.20');
    dockerFixture.destroy();
  });
});
