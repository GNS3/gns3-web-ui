import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodeService } from '@services/node.service';
import { ReloadNodeActionComponent } from './reload-node-action.component';

describe('ReloadNodeActionComponent', () => {
  let component: ReloadNodeActionComponent;
  let fixture: ComponentFixture<ReloadNodeActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReloadNodeActionComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodeService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReloadNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
