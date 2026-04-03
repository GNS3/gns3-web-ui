import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IsolateNodeActionComponent } from './isolate-node-action.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('IsolateNodeActionComponent', () => {
  let fixture: ComponentFixture<IsolateNodeActionComponent>;
  let component: IsolateNodeActionComponent;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockController: Controller;
  let mockNode: Node;

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      project_id: 'proj-1',
      name: 'Test Node',
      status: 'started',
      ...overrides,
    }) as Node;

  beforeEach(async () => {
    mockNodeService = {
      isolate: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockNode = createMockNode();

    await TestBed.configureTestingModule({
      imports: [IsolateNodeActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IsolateNodeActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Inputs', () => {
    it('should accept controller input', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.controller()).toBe(mockController);
    });

    it('should accept node input', () => {
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      expect(component.node()).toBe(mockNode);
    });
  });

  describe('isolate', () => {
    it('should call nodeService.isolate with controller and node', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.isolate();

      expect(mockNodeService.isolate).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should call nodeService.isolate only once', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.isolate();

      expect(mockNodeService.isolate).toHaveBeenCalledTimes(1);
    });

    it('should handle successful isolate without errors', () => {
      mockNodeService.isolate.mockReturnValue(of({}));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.isolate();

      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should show toaster error on isolate failure', () => {
      const errorResponse = { error: { message: 'Failed to isolate node' } };
      mockNodeService.isolate.mockReturnValue(throwError(() => errorResponse));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.isolate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to isolate node');
    });

    it('should call markForCheck on isolate failure', () => {
      const errorResponse = { error: { message: 'Failed to isolate node' } };
      mockNodeService.isolate.mockReturnValue(throwError(() => errorResponse));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      const markForCheckSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.isolate();

      expect(markForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('Template', () => {
    it('should render isolate button', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Isolate');
    });

    it('should call isolate when button is clicked', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockNodeService.isolate).toHaveBeenCalled();
    });
  });
});
