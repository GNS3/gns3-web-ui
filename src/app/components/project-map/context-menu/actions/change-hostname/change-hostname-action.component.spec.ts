import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChangeHostnameActionComponent } from './change-hostname-action.component';
import { ChangeHostnameDialogComponent } from '../../../change-hostname-dialog/change-hostname-dialog.component';
import { Controller } from '@models/controller';
import { Node } from '../../../../../cartography/models/node';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ChangeHostnameActionComponent', () => {
  let fixture: ComponentFixture<ChangeHostnameActionComponent>;
  let component: ChangeHostnameActionComponent;
  let mockDialog: MatDialog;
  let mockDialogRef: MatDialogRef<ChangeHostnameDialogComponent>;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      authToken: 'token',
      location: 'local',
      host: 'localhost',
      port: 8080,
      path: '/',
      ubridge_path: '/usr/local/bin/ubridge',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      tokenExpired: false,
      status: 'stopped',
    } as Controller);

  const createMockNode = (): Node =>
    ({
      node_id: 'test-node-id',
      name: 'Test Node',
      node_type: 'vpcs',
    } as Node);

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
      componentInstance: {},
    } as any;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ChangeHostnameActionComponent, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(ChangeHostnameActionComponent);
    component = fixture.componentInstance;
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Inputs', () => {
    it('should accept controller input', () => {
      const controller = createMockController();
      fixture.componentRef.setInput('controller', controller);
      fixture.detectChanges();

      expect(component.controller()).toBe(controller);
    });

    it('should accept node input', () => {
      const node = createMockNode();
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      expect(component.node()).toBe(node);
    });

    it('should default controller to undefined', () => {
      expect(component.controller()).toBeUndefined();
    });

    it('should default node to undefined', () => {
      expect(component.node()).toBeUndefined();
    });
  });

  describe('changeHostname()', () => {
    it('should open ChangeHostnameDialog', () => {
      fixture.componentRef.setInput('controller', createMockController());
      fixture.componentRef.setInput('node', createMockNode());
      fixture.detectChanges();

      component.changeHostname();

      expect(mockDialog.open).toHaveBeenCalledWith(ChangeHostnameDialogComponent, {
        autoFocus: false,
        disableClose: false,
      });
    });

    it('should pass controller to dialog component instance', () => {
      const controller = createMockController();
      fixture.componentRef.setInput('controller', controller);
      fixture.componentRef.setInput('node', createMockNode());
      fixture.detectChanges();

      component.changeHostname();

      expect(mockDialogRef.componentInstance.controller).toBe(controller);
    });

    it('should pass node to dialog component instance', () => {
      const node = createMockNode();
      fixture.componentRef.setInput('controller', createMockController());
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      component.changeHostname();

      expect(mockDialogRef.componentInstance.node).toBe(node);
    });
  });

  describe('Template', () => {
    it('should render change hostname button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Change hostname');
    });

    it('should call changeHostname when button is clicked', () => {
      fixture.componentRef.setInput('controller', createMockController());
      fixture.componentRef.setInput('node', createMockNode());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });
});
