import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDeleteAllProjectsComponent } from './confirmation-delete-all-projects.component';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { of } from 'rxjs';

describe('ConfirmationDeleteAllProjectsComponent', () => {
  let fixture: ComponentFixture<ConfirmationDeleteAllProjectsComponent>;
  let mockProjectService: any;
  let mockToasterService: any;

  const mockDialogData = {
    controller: 'test-controller',
    deleteFilesPaths: [
      { project_id: 'project-1', filename: 'project1.gns3' },
      { project_id: 'project-2', filename: 'project2.gns3' },
    ],
  };

  beforeEach(async () => {
    mockProjectService = {
      delete: vi.fn().mockReturnValue(of(null)),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmationDeleteAllProjectsComponent, MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDeleteAllProjectsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initial state', () => {
    it('should display confirmation dialog with project list', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('h1[mat-dialog-title]')?.textContent).toContain('Do you want delete all projects?');
      expect(compiled.querySelectorAll('p')[1]?.textContent).toContain('project1.gns3');
      expect(compiled.querySelectorAll('p')[2]?.textContent).toContain('project2.gns3');
    });

    it('should show Delete and Cancel buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[mat-button]');

      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Delete');
      expect(buttons[1].textContent).toContain('Cancel');
    });

    it('should have isDelete and isUsedFiles signals set to false initially', () => {
      expect(fixture.componentInstance.isDelete()).toBeFalsy();
      expect(fixture.componentInstance.isUsedFiles()).toBeFalsy();
    });
  });

  describe('deleteAll()', () => {
    it('should set isDelete signal to true when called', () => {
      mockProjectService.delete.mockReturnValue(of({}));
      fixture.componentInstance.deleteAll();
      fixture.detectChanges();

      expect(fixture.componentInstance.isDelete()).toBeTruthy();
    });
  });

  describe('deleteFile()', () => {
    it('should call projectService.delete for each project', () => {
      mockProjectService.delete.mockReturnValue(of(null));

      fixture.componentInstance.deleteFile();
      fixture.detectChanges();

      expect(mockProjectService.delete).toHaveBeenCalledTimes(2);
      expect(mockProjectService.delete).toHaveBeenCalledWith('test-controller', 'project-1');
      expect(mockProjectService.delete).toHaveBeenCalledWith('test-controller', 'project-2');
    });

    it('should set isUsedFiles to true after deletions complete', () => {
      mockProjectService.delete.mockReturnValue(of(null));

      fixture.componentInstance.deleteFile();
      fixture.detectChanges();

      expect(fixture.componentInstance.isUsedFiles()).toBeTruthy();
      expect(fixture.componentInstance.fileNotDeleted()).toEqual([null, null]);
    });

    it('should set deleteFliesDetails when some deletions fail', () => {
      const errorResponse = { error: { message: 'File in use' } };
      mockProjectService.delete.mockReturnValue(of(errorResponse));

      fixture.componentInstance.deleteFile();
      fixture.detectChanges();

      expect(fixture.componentInstance.deleteFliesDetails().length).toBe(2);
      expect(fixture.componentInstance.isUsedFiles()).toBeTruthy();
    });
  });
});
