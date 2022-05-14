import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControlDirective, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCommonModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { DockerService } from '../../../../services/docker.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddDockerTemplateComponent } from './add-docker-template.component';

export class MockedDockerService {
  public addTemplate(server: Server, dockerTemplate: DockerTemplate) {
    return of(dockerTemplate);
  }
}

//Tests disabled due to instability
xdescribe('AddDockerTemplateComponent', () => {
  let component: AddDockerTemplateComponent;
  let fixture: ComponentFixture<AddDockerTemplateComponent>;

  let mockedServerService = new MockedServerService();
  let mockedDockerService = new MockedDockerService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      imports: [
        MatStepperModule,
        MatAutocompleteModule,
        MatCommonModule,
        MatRadioModule,
        FormsModule,
        MatTableModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: 'server/1/preferences/docker/templates', component: AddDockerTemplateComponent },
        ]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ServerService, useValue: mockedServerService },
        { provide: DockerService, useValue: mockedDockerService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: TemplateMocksService, useClass: TemplateMocksService },
        { provide: DockerConfigurationService, useClass: DockerConfigurationService },
        { provide: AbstractControlDirective, useExisting: FormControl, useMulti: true },
      ],
      declarations: [AddDockerTemplateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDockerTemplateComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should open first step at start', async () => {
    fixture.detectChanges();
   await fixture.whenStable().then(() => {
      let stepperComponent = fixture.debugElement.query(By.css('mat-vertical-stepper')).componentInstance;

      expect(stepperComponent.selectedIndex).toBe(0);
    });
  });

  it('should display correct label at start', async() => {
    fixture.detectChanges();
   await fixture.whenStable().then(() => {
      let selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');

      expect(selectedLabel.textContent).toMatch('Server type');
    });
  });

  it('should not call add template when required fields are empty', async() => {
    fixture.detectChanges();
    await fixture.whenStable().then(() => {
      let addButton = fixture.debugElement.nativeElement.querySelector('.add-button');
      spyOn(mockedDockerService, 'addTemplate').and.returnValue(of({} as DockerTemplate));

      addButton.click();

      expect(component.virtualMachineForm.invalid).toBe(true);
      expect(component.containerNameForm.invalid).toBe(true);
      expect(component.networkAdaptersForm.invalid).toBe(true);

      expect(mockedDockerService.addTemplate).not.toHaveBeenCalled();
    });
  });

  it('should call add template when required fields are filled', async () => {
    fixture.detectChanges();
   await  fixture.whenStable().then(() => {
      let stepperComponent = fixture.debugElement.query(By.css('mat-vertical-stepper')).componentInstance;
      stepperComponent.selectedIndex = 1;
      component.newImageSelected = true;

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        let selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');

        expect(selectedLabel.textContent).toMatch('Docker Virtual Machine');

        let filenameInput = fixture.debugElement.nativeElement.querySelector('.filename');
        filenameInput.value = 'sample filename';
        filenameInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(component.dockerTemplate.image).toBe('sample filename');

          expect(component.virtualMachineForm.invalid).toBe(false);
          expect(component.containerNameForm.invalid).toBe(true);

          stepperComponent.selectedIndex = 2;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');

            expect(selectedLabel.textContent).toMatch('Container name');

            let templatenameInput = fixture.debugElement.nativeElement.querySelector('.templatename');
            templatenameInput.value = 'sample templatename';
            templatenameInput.dispatchEvent(new Event('input'));
            fixture.detectChanges();
            fixture.whenStable().then(() => {
              expect(component.dockerTemplate.name).toBe('sample templatename');

              expect(component.virtualMachineForm.invalid).toBe(false);
              expect(component.containerNameForm.invalid).toBe(false);

              stepperComponent.selectedIndex = 3;
              fixture.detectChanges();
              fixture.whenStable().then(() => {
                selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');

                expect(selectedLabel.textContent).toMatch('Network adapters');

                let networkadapterInput = fixture.debugElement.nativeElement.querySelector('.networkadapter');
                networkadapterInput.value = 2;
                networkadapterInput.dispatchEvent(new Event('input'));
                fixture.detectChanges();
                fixture.whenStable().then(() => {
                  expect(component.dockerTemplate.adapters).toBe(2);

                  expect(component.virtualMachineForm.invalid).toBe(false);
                  expect(component.containerNameForm.invalid).toBe(false);
                  expect(component.networkAdaptersForm.invalid).toBe(false);

                  let addButton = fixture.debugElement.nativeElement.querySelector('.add-button');
                  spyOn(mockedDockerService, 'addTemplate').and.returnValue(of({} as DockerTemplate));

                  addButton.click();

                  expect(mockedDockerService.addTemplate).toHaveBeenCalled();
                });
              });
            });
          });
        });
      });
    });
  });
});
