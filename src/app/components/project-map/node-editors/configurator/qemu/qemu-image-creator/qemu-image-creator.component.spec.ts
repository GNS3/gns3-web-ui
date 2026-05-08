import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QemuImageCreatorComponent } from './qemu-image-creator.component';
import { MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { QemuService } from '@services/qemu.service';
import { NodeService } from '@services/node.service';
import { ValidationService } from '@services/validation';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('QemuImageCreatorComponent', () => {
  let component: QemuImageCreatorComponent;
  let fixture: ComponentFixture<QemuImageCreatorComponent>;

  let mockDialogRef: any;
  let mockToasterService: any;
  let mockQemuService: any;
  let mockNodeService: any;
  let mockValidationService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    status: 'running',
  } as Controller;

  const mockProjectId = 'project-123';
  const mockNodeId = 'node-456';

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockQemuService = {
      createDiskImage: vi.fn(),
    };

    mockNodeService = {};

    mockValidationService = {
      required: vi.fn().mockReturnValue({ isValid: true, errorMessage: '' }),
    };

    await TestBed.configureTestingModule({
      imports: [QemuImageCreatorComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: QemuService, useValue: mockQemuService },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ValidationService, useValue: mockValidationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QemuImageCreatorComponent);
    component = fixture.componentInstance;

    // Set input properties
    component.controller = mockController;
    component.projectId = mockProjectId;
    component.nodeId = mockNodeId;

    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have dialogRef injected', () => {
      expect(component.dialogRef).toBeTruthy();
    });

    it('should have nodeService injected', () => {
      expect(component.nodeService).toBeTruthy();
    });
  });

  describe('Model Signals', () => {
    it('should initialize with empty values', () => {
      expect(component.diskName()).toBe('');
      expect(component.mountPoint()).toBe('');
      expect(component.format()).toBe('');
      expect(component.size()).toBe('');
      expect(component.preallocation()).toBe('');
    });

    it('should update signal values', () => {
      component.diskName.set('test.qcow2');
      component.format.set('qcow2');
      component.size.set('100');
      expect(component.diskName()).toBe('test.qcow2');
      expect(component.format()).toBe('qcow2');
      expect(component.size()).toBe('100');
    });
  });

  describe('Options Properties', () => {
    it('should have mountPointOptions with expected values', () => {
      expect(component.mountPointOptions).toEqual(['hda', 'hdb', 'hdc', 'hdd']);
    });

    it('should have formatOptions with expected values', () => {
      expect(component.formatOptions).toEqual(['qcow2', 'qcow', 'vhd', 'vdi', 'vmdk', 'raw']);
    });

    it('should have preallocationsOptions with expected values', () => {
      expect(component.preallocationsOptions).toEqual(['off', 'metadata', 'falloc', 'full']);
    });

    it('should have clusterSizeOptions', () => {
      expect(component.clusterSizeOptions).toEqual([16, 32, 64, 128, 256]);
    });

    it('should have refcountBitsOptions', () => {
      expect(component.refcountBitsOptions).toEqual([1, 2, 4, 8, 12, 16]);
    });
  });

  describe('onCancelClick', () => {
    it('should call dialogRef.close()', () => {
      component.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onSaveClick validation', () => {
    it('should validate mount point first', () => {
      mockValidationService.required.mockReturnValue({ isValid: false, errorMessage: 'Mount point is required' });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Mount point is required');
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should validate filename after mount point', () => {
      mockValidationService.required
        .mockReturnValueOnce({ isValid: true, errorMessage: '' })   // mount point
        .mockReturnValueOnce({ isValid: false, errorMessage: 'Filename is required' });  // filename

      component.mountPoint.set('hda');
      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Filename is required');
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should validate filename extension matches format', () => {
      component.mountPoint.set('hda');
      component.diskName.set('test.qcow2');
      component.format.set('vmdk');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Filename must end with .vmdk extension for vmdk format'
      );
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should validate format after filename', () => {
      mockValidationService.required
        .mockReturnValueOnce({ isValid: true, errorMessage: '' })   // mount point
        .mockReturnValueOnce({ isValid: true, errorMessage: '' })   // filename
        .mockReturnValueOnce({ isValid: false, errorMessage: 'Format is required' });  // format

      component.mountPoint.set('hda');
      component.diskName.set('test.qcow2');
      component.format.set('qcow2');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Format is required');
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should validate size after format', () => {
      mockValidationService.required
        .mockReturnValueOnce({ isValid: true, errorMessage: '' })   // mount point
        .mockReturnValueOnce({ isValid: true, errorMessage: '' })   // filename
        .mockReturnValueOnce({ isValid: true, errorMessage: '' })   // format
        .mockReturnValueOnce({ isValid: false, errorMessage: 'Size is required' });  // size

      component.mountPoint.set('hda');
      component.diskName.set('test.qcow2');
      component.format.set('qcow2');
      component.size.set('100');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Size is required');
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should show error when size is not a positive integer', () => {
      component.mountPoint.set('hda');
      component.diskName.set('test.qcow2');
      component.format.set('qcow2');
      component.size.set('0');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Size must be a positive integer (at least 1 MB)'
      );
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should show error when size is negative', () => {
      component.mountPoint.set('hda');
      component.diskName.set('test.qcow2');
      component.format.set('qcow2');
      component.size.set('-1');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Size must be a positive integer (at least 1 MB)'
      );
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });
  });

  describe('onSaveClick with valid data', () => {
    beforeEach(() => {
      component.mountPoint.set('hda');
      component.diskName.set('test.qcow2');
      component.format.set('qcow2');
      component.size.set('100');
    });

    it('should call qemuService.createDiskImage with correct parameters', () => {
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(
        mockController, mockProjectId, mockNodeId, 'test.qcow2', {
          format: 'qcow2',
          size: 100,
        }
      );
    });

    it('should close dialog with mountPoint and filename on success', () => {
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        mountPoint: 'hda',
        filename: 'test.qcow2',
      });
    });

    it('should include preallocation when provided', () => {
      component.preallocation.set('full');
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(
        mockController, mockProjectId, mockNodeId, 'test.qcow2', {
          format: 'qcow2',
          size: 100,
          preallocation: 'full',
        }
      );
    });

    it('should include lazy_refcounts when provided', () => {
      component.lazyRefcounts.set('on');
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(
        mockController, mockProjectId, mockNodeId, 'test.qcow2', {
          format: 'qcow2',
          size: 100,
          lazy_refcounts: 'on',
        }
      );
    });

    it('should include optional parameters when provided', () => {
      component.clusterSize.set('64');
      component.refcountBits.set('12');
      component.subformat.set('monolithicSparse');
      component.static.set('on');
      component.adapterType.set('ide');
      component.zeroedGrain.set('on');

      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(
        mockController, mockProjectId, mockNodeId, 'test.qcow2', {
          format: 'qcow2',
          size: 100,
          cluster_size: 64,
          refcount_bits: 12,
          subformat: 'monolithicSparse',
          static: 'on',
          adapter_type: 'ide',
          zeroed_grain: 'on',
        }
      );
    });

    it('should show error toast on API error', () => {
      const errorResponse = {
        error: { detail: 'Disk image creation failed' },
      };
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.error(errorResponse)),
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Disk image creation failed');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show generic error message when error has no detail', () => {
      const errorResponse = { message: 'Network error' };
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.error(errorResponse)),
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
    });

    it('should show default error message when error has no message or detail', () => {
      const errorResponse = {};
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers: any) => handlers.error(errorResponse)),
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to create image');
    });
  });
});
