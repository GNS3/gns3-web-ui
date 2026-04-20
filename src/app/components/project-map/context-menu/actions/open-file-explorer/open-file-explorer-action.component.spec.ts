import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { OpenFileExplorerActionComponent } from './open-file-explorer-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('OpenFileExplorerActionComponent', () => {
  let component: OpenFileExplorerActionComponent;
  let fixture: ComponentFixture<OpenFileExplorerActionComponent>;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    authToken: 'token',
    status: 'running',
    tokenExpired: false,
  };

  const createMockNode = (): Node => ({
    node_id: 'node-1',
    name: 'Test Node',
    status: 'started',
    console_host: '0.0.0.0',
    node_type: 'vpcs',
    project_id: 'proj1',
    command_line: '',
    compute_id: 'compute1',
    height: 50,
    width: 50,
    x: 0,
    y: 0,
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
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatMenuModule],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenFileExplorerActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('button rendering', () => {
    it('should display Open file explorer text', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Open file explorer');
    });

    it('should contain mat-icon element', () => {
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon).toBeTruthy();
    });
  });

  describe('open', () => {
    it('should log message when called in web mode', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      component.open();

      expect(consoleSpy).toHaveBeenCalledWith('Opening file explorer is only supported in Electron mode');
    });

    it('should be callable when button is clicked', () => {
      const openSpy = vi.spyOn(component, 'open');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(openSpy).toHaveBeenCalled();
    });
  });

  describe('inputs', () => {
    it('should accept controller input', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.controller()).toBe(mockController);
    });

    it('should accept node input', () => {
      const mockNode = createMockNode();
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      expect(component.node()).toBe(mockNode);
    });
  });
});
