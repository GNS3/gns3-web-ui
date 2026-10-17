import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteTemplateComponent } from './delete-template.component';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Controller } from '@models/controller';
import { of, throwError, Subject } from 'rxjs';
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
      afterClosed: vi.fn().mockReturnValue(of(false)),
      close: vi.fn(),
    };

    mockTemplateService = {
      deleteTemplate: vi.fn().mockReturnValue(of(undefined)),
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
    if (fixture) {
      fixture.destroy();
    }
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
    component.deleteItem(templateName, templateId, 'qemu');

    expect((component as any).dialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete template?',
        message: `Template "${templateName}" will be permanently deleted.`,
        note: 'This action cannot be undone.',
        confirmButtonText: 'Delete template',
        tone: 'danger',
        checkbox: { label: 'Also delete unused images belonging to this template', checked: false },
      },
      disableClose: true,
    });
  });

  it.each(['qemu', 'dynamips', 'iou'])('offers optional image cleanup for %s templates', (type) => {
    component.deleteItem(templateName, templateId, type);
    expect((component as any).dialog.open.mock.calls[0][1].data.checkbox?.checked).toBe(false);
  });

  it.each(['docker', 'vpcs', 'cloud', 'nat', 'ethernet_hub', 'ethernet_switch', 'virtualbox', 'vmware', undefined])(
    'does not offer image cleanup for %s templates', (type) => {
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      component.deleteItem(templateName, templateId, type);
      expect((component as any).dialog.open.mock.calls[0][1].data.checkbox).toBeUndefined();
      expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(undefined, templateId, false);
    }
  );

  it('resets cleanup when reopening the dialog or switching to an unsupported template', () => {
    component.deleteItem(templateName, templateId, 'qemu');
    const open = (component as any).dialog.open;
    const firstCheckbox = open.mock.calls[0][1].data.checkbox;
    firstCheckbox.checked = true;

    component.deleteItem(templateName, templateId, 'iou');
    expect(open.mock.calls[1][1].data.checkbox.checked).toBe(false);
    expect(open.mock.calls[1][1].data.checkbox).not.toBe(firstCheckbox);

    component.deleteItem(templateName, templateId, 'docker');
    expect(open.mock.calls[2][1].data.checkbox).toBeUndefined();
    expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();
  });

  it('passes a real dialog checkbox selection through to template deletion', async () => {
    (component as any).dialog.open.mockRestore();
    fixture.componentRef.setInput('controller', mockController);
    component.deleteItem(templateName, templateId, 'qemu');
    await vi.runAllTimersAsync();

    const checkbox = document.querySelector('mat-checkbox input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    checkbox.click();
    (document.querySelector('.confirmation-dialog .confirm-button') as HTMLButtonElement).click();
    await vi.runAllTimersAsync();

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(mockController, templateId, true);
    expect(mockToasterService.success).toHaveBeenCalledWith(`Template ${templateName} deleted.`);
  });

  it('should not delete template when dialog returns false', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(false));

    component.deleteItem(templateName, templateId, 'qemu');

    expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();
    expect(mockToasterService.success).not.toHaveBeenCalled();
  });

  it('keeps image cleanup off by default', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));
    fixture.componentRef.setInput('controller', mockController);
    component.deleteItem(templateName, templateId, 'qemu');
    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(mockController, templateId, false);
  });

  it('passes the checked cleanup option only after confirmation', () => {
    const closed = new Subject<boolean>();
    mockDialogRef.afterClosed.mockReturnValue(closed);
    fixture.componentRef.setInput('controller', mockController);
    component.deleteItem(templateName, templateId, 'qemu');
    const options = (component as any).dialog.open.mock.calls[0][1];
    options.data.checkbox.checked = true;
    expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();
    closed.next(true);
    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(mockController, templateId, true);
  });

  it('does not delete anything when cleanup is checked but the user cancels', () => {
    const closed = new Subject<boolean>();
    mockDialogRef.afterClosed.mockReturnValue(closed);
    component.deleteItem(templateName, templateId, 'qemu');
    (component as any).dialog.open.mock.calls[0][1].data.checkbox.checked = true;
    closed.next(false);
    expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();
  });

  it('reports a refused image cleanup without emitting a deletion event', () => {
    const closed = new Subject<boolean>();
    mockDialogRef.afterClosed.mockReturnValue(closed);
    mockTemplateService.deleteTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Image is in use' } })));
    const deleted = vi.fn();
    component.deleteEvent.subscribe(deleted);
    component.deleteItem(templateName, templateId, 'qemu');
    (component as any).dialog.open.mock.calls[0][1].data.checkbox.checked = true;
    closed.next(true);
    expect(mockToasterService.error).toHaveBeenCalledWith('Image is in use');
    expect(mockToasterService.success).not.toHaveBeenCalled();
    expect(deleted).not.toHaveBeenCalled();
  });

  it('should not emit deleteEvent when dialog returns false', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(false));

    let emittedTemplateId: string | undefined;
    component.deleteEvent.subscribe((id: string) => {
      emittedTemplateId = id;
    });

    component.deleteItem(templateName, templateId, 'qemu');

    expect(emittedTemplateId).toBeUndefined();
  });

  it('should delete template when dialog returns true', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    component.deleteItem(templateName, templateId, 'qemu');

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalled();
  });

  it('should emit deleteEvent with templateId when dialog returns true', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    let emittedTemplateId: string | undefined;
    component.deleteEvent.subscribe((id: string) => {
      emittedTemplateId = id;
    });

    component.deleteItem(templateName, templateId, 'qemu');

    expect(emittedTemplateId).toBe(templateId);
  });

  it('should show success toaster when template is deleted', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    component.deleteItem(templateName, templateId, 'qemu');

    expect(mockToasterService.success).toHaveBeenCalledWith(`Template ${templateName} deleted.`);
  });

  it('should display error toaster when deleteTemplate fails', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    mockTemplateService.deleteTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Delete failed' } })));

    component.deleteItem(templateName, templateId, 'qemu');

    expect(mockToasterService.error).toHaveBeenCalledWith('Delete failed');
  });

  it('should unsubscribe from dialog afterClosed when component is destroyed', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    const unsubscribeSpy = vi.spyOn(mockDialogRef, 'afterClosed');

    component.deleteItem(templateName, templateId, 'qemu');

    if (fixture) {
      fixture.destroy();
    }

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should call deleteTemplate with undefined controller when user confirms without setting controller', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    component.deleteItem('My Special Template', 'special-id-456', 'qemu');

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(undefined, 'special-id-456', false);
  });
});
