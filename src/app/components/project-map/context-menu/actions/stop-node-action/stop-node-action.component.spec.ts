import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockedNodeService } from 'app/components/project-map/project-map.component.spec';
import { HttpController } from 'app/services/http-controller.service';
import { NodeService } from 'app/services/node.service';
import { StopNodeActionComponent } from './stop-node-action.component';

describe('StopNodeActionComponent', () => {
  let component: StopNodeActionComponent;
  let fixture: ComponentFixture<StopNodeActionComponent>;
  let mockedNodeService : MockedNodeService
  
  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [StopNodeActionComponent],
      providers:[
        {provide:NodeService , useValue: mockedNodeService},
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
