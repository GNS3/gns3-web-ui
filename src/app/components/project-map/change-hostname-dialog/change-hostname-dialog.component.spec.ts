import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ChangeHostnameDialogComponent } from './change-hostname-dialog.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';

describe('ChangeHostnameDialogComponent', () => {
  let component: ChangeHostnameDialogComponent;
  let fixture: ComponentFixture<ChangeHostnameDialogComponent>;
  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockCdr: any;

  const mockNode: Node = {
    id: 'node-1',
    name: 'Router1',
    project_id: 'project-1',
    compute_id: 'local',
    node_type: 'router',
    properties: {},
    ports: [],
    links: [],
    label: null,
    x: 0,
    y: 0,
    z: 0,
  } as unknown as Node;

  const mockController: Controller = {
    id: 1,
    name: 'Local Controller',
    host: '127.0.0.1',
    port: 3080,
    location: 'local',
    authToken: '',
    path: '',
    ubridge_path: '',
    protocol: 'http:',
    username: '',
    password: '',
  } as unknown as Controller;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockNodeService = { updateNode: vi.fn() };
    mockToasterService = { success: vi.fn(), error: vi.fn() };
    mockCdr = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ChangeHostnameDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeHostnameDialogComponent);
    component = fixture.componentInstance;
    component.node = mockNode;
    component.controller = mockController;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('ngOnInit', () => {
    it('should initialize form with node name when node is provided', () => {
      component.ngOnInit();
      expect(component.inputForm.get('name')?.value).toBe('Router1');
      expect(component.name).toBe('Router1');
    });

    it('should display node name in the dialog title', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('.change-hostname__title'));
      expect(title.nativeElement.textContent).toContain('Router1');
    });
  });

  describe('onSaveClick', () => {
    it('should update node and close dialog when form is valid', () => {
      mockNodeService.updateNode.mockReturnValue(of({}));
      component.ngOnInit();
      component.inputForm.get('name')?.setValue('NewRouter');
      fixture.detectChanges();

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
      expect(component.node.name).toBe('NewRouter');
      expect(mockToasterService.success).toHaveBeenCalledWith('Node NewRouter updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when form is invalid', () => {
      component.ngOnInit();
      component.inputForm.get('name')?.setValue('');
      fixture.detectChanges();

      component.onSaveClick();

      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show error toast when API call fails', async () => {
      mockNodeService.updateNode.mockReturnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.ngOnInit();
      component.inputForm.get('name')?.setValue('NewRouter');
      fixture.detectChanges();

      component.onSaveClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Server error');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should use fallback message when error has no message', async () => {
      mockNodeService.updateNode.mockReturnValue(throwError(() => ({})));
      component.ngOnInit();
      component.inputForm.get('name')?.setValue('NewRouter');
      fixture.detectChanges();

      component.onSaveClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node.');
    });

    it('should call markForCheck when API call fails', async () => {
      mockNodeService.updateNode.mockReturnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.ngOnInit();
      component.inputForm.get('name')?.setValue('NewRouter');
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.onSaveClick();
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('template interactions', () => {
    it('should trigger onCancelClick when Cancel button is clicked', () => {
      const cancelButton = fixture.debugElement.query(By.css('button[color="accent"]'));
      cancelButton.nativeElement.click();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should trigger onSaveClick when Apply button is clicked', () => {
      mockNodeService.updateNode.mockReturnValue(of({}));
      component.ngOnInit();
      fixture.detectChanges();

      const applyButton = fixture.debugElement.query(By.css('button[color="primary"]'));
      applyButton.nativeElement.click();

      expect(mockNodeService.updateNode).toHaveBeenCalled();
    });
  });
});
