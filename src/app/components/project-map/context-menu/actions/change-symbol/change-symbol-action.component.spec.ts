import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ChangeSymbolActionComponent } from './change-symbol-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DialogConfigService } from '@services/dialog-config.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ChangeSymbolActionComponent', () => {
  let fixture: ComponentFixture<ChangeSymbolActionComponent>;

  const mockController: Controller = {
    id: 1,
    authToken: 'token',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  };

  const createMockNode = (): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'vpcs',
      project_id: 'project-1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 50,
      x: 100,
      y: 200,
      z: 0,
      label: { text: '', x: 0, y: 0, style: '', rotation: 0 },
      locked: false,
      first_port_name: '',
      port_name_format: '',
      port_segment_size: 1,
      ports: [],
      properties: {} as any,
      symbol: '',
      symbol_url: '',
      console: 0,
      console_auto_start: false,
      console_type: '',
      node_directory: '',
    } as unknown as Node);

  let mockDialogRef: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: {},
      afterClosed: vi.fn().mockReturnValue(of(undefined)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    await TestBed.configureTestingModule({
      imports: [ChangeSymbolActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(ChangeSymbolActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('rendering', () => {
    it('should display "Change symbol" text in button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.textContent).toContain('Change symbol');
    });

    it('should display find_replace icon in button', () => {
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('find_replace');
    });
  });

  describe('changeSymbol', () => {
    it('should exist as a method on the component', () => {
      expect(typeof fixture.componentInstance.changeSymbol).toBe('function');
    });

    it('should open ChangeSymbolDialogComponent when called', () => {
      fixture.detectChanges();

      fixture.componentInstance.changeSymbol();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should pass controller to dialog instance', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.componentInstance.changeSymbol();

      expect(mockDialogRef.componentInstance.controller).toBe(mockController);
    });

    it('should pass node to dialog instance', () => {
      const node = createMockNode();
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      fixture.componentInstance.changeSymbol();

      expect(mockDialogRef.componentInstance.node).toBe(node);
    });

    it('should be called when button is clicked', () => {
      fixture.detectChanges();

      const changeSymbolSpy = vi.spyOn(fixture.componentInstance, 'changeSymbol');
      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(changeSymbolSpy).toHaveBeenCalled();
    });
  });
});
