import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialog } from "@angular/material";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Component, NgModule } from '@angular/core';
import { Project } from '../../../models/project';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { OverlayContainer } from '@angular/cdk/overlay';

describe('ConfirmationDialogComponent', () => {
  let dialog: MatDialog;
  let overlayContainerElement: HTMLElement;

  let noop: ComponentFixture<NoopComponent>;
  let existingProject: Project = {
      auto_close: false,
      auto_open: false,
      auto_start: false,
      filename: "blank",
      name: "blank",
      path: "",
      project_id: "",
      scene_height: 100,
      scene_width: 100,
      status: "",
      readonly: false,
      show_interface_labels: false,
      show_layers: false,
      show_grid: false,
      snap_to_grid: false,
  };
       
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ DialogTestModule ],
      providers: [
        { provide: OverlayContainer, useFactory: () => {
          overlayContainerElement = document.createElement('div');
          return { getContainerElement: () => overlayContainerElement };
        }}
      ]
    });

    dialog = TestBed.get(MatDialog);

    noop = TestBed.createComponent(NoopComponent);
  });

  it('should show correct message if project is open', () => {
    existingProject.status = "opened";
    const config  = {
        data: {
            'existingProject' : existingProject
        }
    };

    dialog.open(ConfirmationDialogComponent, config);
    noop.detectChanges();

    const message = overlayContainerElement.querySelector('span');
    expect(message.textContent).toBe("Project blank is open. You can not overwrite it.");
  });

  it('should show correct message if project is closed', () => {
    existingProject.status = "closed";
    const config  = {
        data: {
            'existingProject' : existingProject
        }
    };

    dialog.open(ConfirmationDialogComponent, config);
    noop.detectChanges();

    const message = overlayContainerElement.querySelector('span');
    expect(message.textContent).toBe("Project blank already exist, overwrite it?");
  });

  it('should return false after closing when project is open', () => {
    existingProject.status = "opened";
    const config  = {
        data: {
            'existingProject' : existingProject
        }
    };

    let dialogRef = dialog.open(ConfirmationDialogComponent, config);
    noop.detectChanges();
    const button = overlayContainerElement.querySelector('button');
    spyOn(dialogRef.componentInstance.dialogRef, 'close');
    button.click();

    expect(dialogRef.componentInstance.dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should return true after choosing overriding', () => {
    existingProject.status = "closed";
    const config  = {
        data: {
            'existingProject' : existingProject
        }
    };

    let dialogRef = dialog.open(ConfirmationDialogComponent, config);
    noop.detectChanges();
    const button: HTMLButtonElement = overlayContainerElement.querySelector('.confirmButton');
    spyOn(dialogRef.componentInstance.dialogRef, 'close');
    button.click();

    expect(dialogRef.componentInstance.dialogRef.close).toHaveBeenCalledWith(true);
  });
});

@Component({
    template: ''
})
class NoopComponent {}

const TEST_DIRECTIVES = [
    ConfirmationDialogComponent,
    NoopComponent
];

@NgModule({
    imports: [MatDialogModule, NoopAnimationsModule],
    exports: TEST_DIRECTIVES,
    declarations: TEST_DIRECTIVES,
    entryComponents: [
      ConfirmationDialogComponent
    ],
})
class DialogTestModule { }
