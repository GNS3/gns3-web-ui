import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs/internal/observable/of';
import { Node } from '../../../../cartography/models/node';
import { Controller } from '../../../../models/controller';
import { NodeService } from '../../../../services/node.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedNodeService } from '../../project-map.component.spec';
import { ConfigEditorDialogComponent } from './config-editor.component';

describe('ConfigEditorDialogComponent', () => {
  let component: ConfigEditorDialogComponent;
  let fixture: ComponentFixture<ConfigEditorDialogComponent>;
  let controller:Controller ;
  let node: Node;
  let toaster = {
    success: jasmine.createSpy('success'),
  };
  let dialogRef = {
    close: jasmine.createSpy('close'),
  };
  let mockedNodeService: MockedNodeService = new MockedNodeService();

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        FormsModule,
        MatTabsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: ToasterService, useValue: toaster },
      ],
      declarations: [ConfigEditorDialogComponent],
    }).compileComponents();

    controller = new Controller  ();
    controller.host = 'localhost';
    controller.port = 80;

    node = new Node();
    node.name = 'sample name';
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigEditorDialogComponent);
    component = fixture.componentInstance;
    component.controller =  controller;
    component.node = node;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should call node service when save configuration chosen', () => {
    spyOn(mockedNodeService, 'saveConfiguration').and.returnValue(of('sample config'));

    component.onSaveClick();

    expect(mockedNodeService.saveConfiguration).toHaveBeenCalled();
  });

  it('should not call node service when save configuration chosen', () => {
    spyOn(mockedNodeService, 'saveConfiguration').and.returnValue(of('sample config'));

    component.onCancelClick();

    expect(mockedNodeService.saveConfiguration).not.toHaveBeenCalled();
  });
});
