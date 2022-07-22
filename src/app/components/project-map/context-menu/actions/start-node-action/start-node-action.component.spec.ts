import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MockedNodeService } from 'app/components/project-map/project-map.component.spec';
import { HttpController } from 'app/services/http-controller.service';
import { NodeService } from 'app/services/node.service';
import { ToasterService } from 'app/services/toaster.service';
import { MockedToasterService } from 'app/services/toaster.service.spec';
import { StartNodeActionComponent } from './start-node-action.component';

describe('StartNodeActionComponent', () => {
  let component: StartNodeActionComponent;
  let fixture: ComponentFixture<StartNodeActionComponent>;
  let mockedNodeService: MockedNodeService;
  let mockedToasterService: MockedToasterService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [StartNodeActionComponent],
      imports:[MatProgressSpinnerModule ],
      providers: [
        { provide: NodeService, useValue: mockedNodeService },
        { provide: HttpController, useValue: {} },
        { provide: ToasterService, useValue: mockedToasterService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StartNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
