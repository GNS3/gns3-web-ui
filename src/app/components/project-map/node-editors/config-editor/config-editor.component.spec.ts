import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Server } from '../../../../models/server';
import {
  MatDialogModule,
  MatFormFieldModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBarModule,
  MatTabsModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ToasterService } from '../../../../services/toaster.service';
import { of } from 'rxjs/internal/observable/of';
import { ConfigEditorDialogComponent } from './config-editor.component';
import { NodeService } from '../../../../services/node.service';
import { FormsModule } from '@angular/forms';
import { MockedNodeService } from '../../project-map.component.spec';
import { Node } from '../../../../cartography/models/node';

describe('ConfigEditorDialogComponent', () => {
  let component: ConfigEditorDialogComponent;
  let fixture: ComponentFixture<ConfigEditorDialogComponent>;
  let server: Server;
  let node: Node;
  let toaster = {
    success: jasmine.createSpy('success')
  };
  let dialogRef = {
    close: jasmine.createSpy('close')
  };
  let mockedNodeService: MockedNodeService = new MockedNodeService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        FormsModule,
        MatTabsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: ToasterService, useValue: toaster }
      ],
      declarations: [ConfigEditorDialogComponent]
    }).compileComponents();

    server = new Server();
    server.host = 'localhost';
    server.port = 80;

    node = new Node();
    node.name = 'sample name';
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigEditorDialogComponent);
    component = fixture.componentInstance;
    component.server = server;
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
