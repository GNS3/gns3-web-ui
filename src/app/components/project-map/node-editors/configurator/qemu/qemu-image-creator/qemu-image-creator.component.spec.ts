import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QemuImageCreatorComponent } from './qemu-image-creator.component';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { QemuService } from '@services/qemu.service';
import { NodeService } from '@services/node.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('QemuImageCreatorComponent', () => {
  let component: QemuImageCreatorComponent;
  let fixture: ComponentFixture<QemuImageCreatorComponent>;

  let mockDialogRef: any;
  let mockToasterService: any;
  let mockQemuService: any;
  let mockNodeService: any;

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

    await TestBed.configureTestingModule({
      imports: [QemuImageCreatorComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: QemuService, useValue: mockQemuService },
        { provide: NodeService, useValue: mockNodeService },
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

  describe('Form Configuration', () => {
    it('should have inputForm as UntypedFormGroup', () => {
      expect(component.inputForm).toBeInstanceOf(UntypedFormGroup);
    });

    it('should have disk_name control with required validator', () => {
      const diskNameControl = component.inputForm.get('disk_name');
      expect(diskNameControl).toBeInstanceOf(UntypedFormControl);
      expect(diskNameControl?.hasValidator(Validators.required)).toBe(true);
    });

    it('should have format control with required validator', () => {
      const formatControl = component.inputForm.get('format');
      expect(formatControl).toBeInstanceOf(UntypedFormControl);
      expect(formatControl?.hasValidator(Validators.required)).toBe(true);
    });

    it('should have size control with required and min(1) validators', () => {
      const sizeControl = component.inputForm.get('size');
      expect(sizeControl).toBeInstanceOf(UntypedFormControl);
      expect(sizeControl?.hasValidator(Validators.required)).toBe(true);
    });

    it('should have preallocation control without required validator', () => {
      const preallocControl = component.inputForm.get('preallocation');
      expect(preallocControl).toBeInstanceOf(UntypedFormControl);
      expect(preallocControl?.hasValidator(Validators.required)).toBe(false);
    });

    it('should have lazy_refcounts control without required validator', () => {
      const lazyRefControl = component.inputForm.get('lazy_refcounts');
      expect(lazyRefControl).toBeInstanceOf(UntypedFormControl);
      expect(lazyRefControl?.hasValidator(Validators.required)).toBe(false);
    });
  });

  describe('Options Properties', () => {
    it('should have diskOptions with expected values', () => {
      expect(component.diskOptions).toEqual(['hda', 'hdb', 'hdc', 'hdd', 'ide0', 'ide1', 'scsi0', 'scsi1', 'scsi2']);
    });

    it('should have formatOptions with expected values', () => {
      expect(component.formatOptions).toEqual(['qcow2', 'qcow', 'vhd', 'vdi', 'vmdk', 'raw']);
    });

    it('should have preallocationsOptions with expected values', () => {
      expect(component.preallocationsOptions).toEqual(['off', 'metadata', 'falloc', 'full']);
    });
  });

  describe('_filterDisks', () => {
    it('should return all disks when value is empty', () => {
      const result = (component as any)._filterDisks('');
      expect(result).toEqual(component.diskOptions);
    });

    it('should return matching disks when value is partial', () => {
      const result = (component as any)._filterDisks('hda');
      expect(result).toContain('hda');
    });

    it('should be case insensitive', () => {
      const result = (component as any)._filterDisks('SCSI');
      expect(result).toContain('scsi0');
      expect(result).toContain('scsi1');
      expect(result).toContain('scsi2');
    });

    it('should return empty array when no disks match', () => {
      const result = (component as any)._filterDisks('xyz');
      expect(result).toEqual([]);
    });

    it('should match ide disks', () => {
      const result = (component as any)._filterDisks('ide');
      expect(result).toEqual(['ide0', 'ide1']);
    });
  });

  describe('filteredDisks$', () => {
    it('should be an Observable', () => {
      expect(component.filteredDisks$).toBeTruthy();
    });
  });

  describe('onCancelClick', () => {
    it('should call dialogRef.close()', () => {
      component.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onSaveClick with invalid form', () => {
    it('should show error toast when disk_name is missing', () => {
      component.inputForm.patchValue({
        format: 'qcow2',
        size: 100,
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Disk name'));
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should show error toast when format is missing', () => {
      component.inputForm.patchValue({
        disk_name: 'hda',
        size: 100,
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Format'));
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should show error toast when size is missing', () => {
      component.inputForm.patchValue({
        disk_name: 'hda',
        format: 'qcow2',
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Size'));
      expect(mockQemuService.createDiskImage).not.toHaveBeenCalled();
    });

    it('should show error with multiple missing fields', () => {
      component.inputForm.patchValue({});

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Disk name'));
      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Format'));
      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Size'));
    });
  });

  describe('onSaveClick with valid form', () => {
    beforeEach(() => {
      component.inputForm.patchValue({
        disk_name: 'hda',
        format: 'qcow2',
        size: 100,
      });
    });

    it('should call qemuService.createDiskImage with correct parameters', () => {
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(mockController, mockProjectId, mockNodeId, 'hda', {
        format: 'qcow2',
        size: 100,
      });
    });

    it('should close dialog on success', () => {
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should include preallocation when provided', () => {
      component.inputForm.patchValue({
        preallocation: 'full',
      });

      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(mockController, mockProjectId, mockNodeId, 'hda', {
        format: 'qcow2',
        size: 100,
        preallocation: 'full',
      });
    });

    it('should include lazy_refcounts when provided', () => {
      component.inputForm.patchValue({
        lazy_refcounts: 'on',
      });

      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.next()),
      });

      component.onSaveClick();

      expect(mockQemuService.createDiskImage).toHaveBeenCalledWith(mockController, mockProjectId, mockNodeId, 'hda', {
        format: 'qcow2',
        size: 100,
        lazy_refcounts: 'on',
      });
    });

    it('should show error toast on API error', () => {
      const errorResponse = {
        error: { detail: 'Disk image creation failed' },
      };
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.error(errorResponse)),
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Disk image creation failed');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show generic error message when error has no detail', () => {
      const errorResponse = { message: 'Network error' };
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.error(errorResponse)),
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
    });

    it('should show default error message when error has no message or detail', () => {
      const errorResponse = {};
      mockQemuService.createDiskImage.mockReturnValue({
        subscribe: vi.fn((handlers) => handlers.error(errorResponse)),
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to create image');
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.inputForm.valid).toBe(false);
    });

    it('should be valid when all required fields are filled', () => {
      component.inputForm.patchValue({
        disk_name: 'hda',
        format: 'qcow2',
        size: 100,
      });

      expect(component.inputForm.valid).toBe(true);
    });

    it('should be invalid when size is 0', () => {
      component.inputForm.patchValue({
        disk_name: 'hda',
        format: 'qcow2',
        size: 0,
      });

      expect(component.inputForm.valid).toBe(false);
    });

    it('should be invalid when size is negative', () => {
      component.inputForm.patchValue({
        disk_name: 'hda',
        format: 'qcow2',
        size: -1,
      });

      expect(component.inputForm.valid).toBe(false);
    });
  });
});
