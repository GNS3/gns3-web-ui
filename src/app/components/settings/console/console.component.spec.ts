import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ConsoleService } from '@services/settings/console.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ConsoleComponent } from './console.component';

describe('ConsoleComponent', () => {
  let component: ConsoleComponent;
  let fixture: ComponentFixture<ConsoleComponent>;
  let consoleService;
  let router;
  let toaster: MockedToasterService;

  beforeEach(async () => {
    consoleService = {
      command: 'command',
    };

    router = {
      navigate: jasmine.createSpy('navigate'),
    };

    toaster = new MockedToasterService();

    await TestBed.configureTestingModule({
      providers: [
        { provide: ConsoleService, useValue: consoleService },
        { provide: ToasterService, useValue: toaster },
        { provide: Router, useValue: router },
      ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatCardModule,
        MatInputModule,
        NoopAnimationsModule,
      ],
      declarations: [ConsoleComponent],
    }).compileComponents();
  });

beforeEach(() => {
  fixture = TestBed.createComponent(ConsoleComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('should create', () => {
  expect(component).toBeTruthy();
});

it('should set default command', () => {
  component.ngOnInit();
  expect(component.consoleForm.value.command).toEqual('command');
});

it('should go back', () => {
  component.goBack();
  expect(router.navigate).toHaveBeenCalledWith(['/settings']);
});

it('should update console command', () => {
  component.consoleForm.get('command').setValue('newCommand');
  spyOn(component, 'goBack');
  component.save();
  expect(toaster.success.length).toEqual(1);
  expect(component.goBack).toHaveBeenCalled();
});
});
