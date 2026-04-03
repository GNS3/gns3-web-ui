import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { TemplateNameDialogComponent } from './template-name-dialog.component';
import { ProjectNameValidator } from '../../../projects/models/projectNameValidator';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TemplateNameDialogComponent', () => {
  let component: TemplateNameDialogComponent;
  let fixture: ComponentFixture<TemplateNameDialogComponent>;
  let mockDialogRef: any;
  let mockTemplateService: any;
  let mockToasterService: any;
  let mockProjectNameValidator: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;

  const createMockTemplate = (id: string, name: string): Template =>
    ({
      template_id: id,
      builtin: false,
      category: 'router',
      compute_id: 'local',
      default_name_format: '{name}-{0}',
      name,
      node_type: 'vpcs',
      symbol: 'router',
      template_type: 'dynamips',
    }) as Template;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockTemplateService = {
      list: vi.fn().mockReturnValue(of([])),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockProjectNameValidator = {
      get: vi.fn().mockReturnValue(null),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
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

    await TestBed.configureTestingModule({
      imports: [
        TemplateNameDialogComponent,
        ReactiveFormsModule,
        MatDialogModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { name: '' } },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProjectNameValidator, useValue: mockProjectNameValidator },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateNameDialogComponent);
    component = fixture.componentInstance;
    // Controller is set via dialogRef.componentInstance.controller after dialog is opened
    component.controller = mockController;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form on ngOnInit', () => {
      expect(component.templateNameForm).toBeDefined();
      expect(component.templateNameForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.templateNameForm.controls['templateName']).toBeInstanceOf(UntypedFormControl);
    });

  });

  describe('onNoClick', () => {
    it('should close the dialog without value when cancel button is clicked', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onKeyDown', () => {
    it('should call onAddClick when Enter key is pressed', () => {
      const enterEvent = { key: 'Enter' };
      const onAddClickSpy = vi.spyOn(component, 'onAddClick');

      component.onKeyDown(enterEvent);

      expect(onAddClickSpy).toHaveBeenCalled();
    });

    it('should not call onAddClick for non-Enter keys', () => {
      const escapeEvent = { key: 'Escape' };
      const onAddClickSpy = vi.spyOn(component, 'onAddClick');

      component.onKeyDown(escapeEvent);

      expect(onAddClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('onAddClick', () => {
    it('should show error when form is invalid due to empty template name', () => {
      component.templateNameForm.controls['templateName'].setValue(null);
      fixture.detectChanges();

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Please enter correct name for new template');
      expect(mockTemplateService.list).not.toHaveBeenCalled();
    });

    it('should show error when form is invalid due to invalid name characters', () => {
      mockProjectNameValidator.get.mockReturnValue({ invalidName: true });
      component.templateNameForm.controls['templateName'].setValue('invalid@name!');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Please enter correct name for new template');
      expect(mockTemplateService.list).not.toHaveBeenCalled();
    });

    it('should call templateService.list with controller when form is valid', () => {
      component.templateNameForm.controls['templateName'].setValue('ValidTemplate');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockTemplateService.list).toHaveBeenCalledWith(mockController);
    });

    it('should close dialog with template name when no duplicate template exists', () => {
      mockTemplateService.list.mockReturnValue(of([]));
      component.templateNameForm.controls['templateName'].setValue('NewTemplate');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith('NewTemplate');
    });

    it('should show error when template with same name already exists', () => {
      const existingTemplates = [createMockTemplate('t1', 'ExistingTemplate')];
      mockTemplateService.list.mockReturnValue(of(existingTemplates));
      component.templateNameForm.controls['templateName'].setValue('ExistingTemplate');
      fixture.detectChanges();

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Template with this name exists');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('form validation display', () => {
    it('should expose form controls via form getter', () => {
      expect(component.form).toBeDefined();
      expect(component.form['templateName']).toBeDefined();
    });
  });
});
