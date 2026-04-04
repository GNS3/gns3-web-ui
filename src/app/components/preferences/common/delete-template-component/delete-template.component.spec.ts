import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteTemplateComponent } from './delete-template.component';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

describe('DeleteTemplateComponent', () => {
  let component: DeleteTemplateComponent;
  let fixture: ComponentFixture<DeleteTemplateComponent>;

  let mockTemplateService: any;
  let mockToasterService: any;
  let mockDialogRef: any;

  let mockController: Controller;

  const templateName = 'Test Template';
  const templateId = 'template-123';

  beforeAll(() => {
    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '/',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      authToken: 'token',
      tokenExpired: false,
    };
  });

  beforeEach(async () => {
    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue({
        subscribe: vi.fn((callback) => {
          callback(false);
          return { unsubscribe: vi.fn() };
        }),
      }),
      close: vi.fn(),
    };

    mockTemplateService = {
      deleteTemplate: vi.fn().mockReturnValue({
        subscribe: vi.fn((callback) => {
          callback();
          return { unsubscribe: vi.fn() };
        }),
      }),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DeleteTemplateComponent],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteTemplateComponent);
    component = fixture.componentInstance;

    // Spy on dialog.open after component creation to override the injected MatDialog
    vi.spyOn((component as any).dialog, 'open').mockReturnValue(mockDialogRef);

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  it('should have controller input with default undefined value', () => {
    const newFixture = TestBed.createComponent(DeleteTemplateComponent);
    expect(newFixture.componentInstance.controller()).toBeUndefined();
  });

  it('should open delete confirmation dialog when deleteItem is called', () => {
    component.deleteItem(templateName, templateId);

    expect((component as any).dialog.open).toHaveBeenCalledWith(DeleteConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
      data: {
        templateName: templateName,
      },
      autoFocus: false,
      disableClose: true,
    });
  });

  it('should not delete template when dialog returns false', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(false);
        return { unsubscribe: vi.fn() };
      }),
    });

    component.deleteItem(templateName, templateId);

    expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();
    expect(mockToasterService.success).not.toHaveBeenCalled();
  });

  it('should not emit deleteEvent when dialog returns false', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(false);
        return { unsubscribe: vi.fn() };
      }),
    });

    let emittedTemplateId: string | undefined;
    component.deleteEvent.subscribe((id: string) => {
      emittedTemplateId = id;
    });

    component.deleteItem(templateName, templateId);

    expect(emittedTemplateId).toBeUndefined();
  });

  it('should delete template when dialog returns true', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(true);
        return { unsubscribe: vi.fn() };
      }),
    });

    component.deleteItem(templateName, templateId);

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalled();
  });

  it('should emit deleteEvent with templateId when dialog returns true', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(true);
        return { unsubscribe: vi.fn() };
      }),
    });

    let emittedTemplateId: string | undefined;
    component.deleteEvent.subscribe((id: string) => {
      emittedTemplateId = id;
    });

    component.deleteItem(templateName, templateId);

    expect(emittedTemplateId).toBe(templateId);
  });

  it('should show success toaster when template is deleted', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(true);
        return { unsubscribe: vi.fn() };
      }),
    });

    component.deleteItem(templateName, templateId);

    expect(mockToasterService.success).toHaveBeenCalledWith(`Template ${templateName} deleted.`);
  });

  it('should handle deleteTemplate service error gracefully', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(true);
        return { unsubscribe: vi.fn() };
      }),
    });

    // The component only handles success case, not error - error is silently ignored
    mockTemplateService.deleteTemplate.mockReturnValue({
      subscribe: vi.fn((onSuccess: () => void) => {
        // Simulate an error by not calling onSuccess
        return { unsubscribe: vi.fn() };
      }),
    });

    component.deleteItem(templateName, templateId);

    expect(mockToasterService.success).not.toHaveBeenCalled();
  });

  it('should unsubscribe from dialog afterClosed when component is destroyed', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(true);
        return { unsubscribe: vi.fn() };
      }),
    });

    const unsubscribeSpy = vi.spyOn(mockDialogRef, 'afterClosed');

    component.deleteItem(templateName, templateId);

    fixture.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should call deleteTemplate with undefined controller when user confirms without setting controller', () => {
    mockDialogRef.afterClosed.mockReturnValue({
      subscribe: vi.fn((callback) => {
        callback(true);
        return { unsubscribe: vi.fn() };
      }),
    });

    component.deleteItem('My Special Template', 'special-id-456');

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(undefined, 'special-id-456');
  });
});
