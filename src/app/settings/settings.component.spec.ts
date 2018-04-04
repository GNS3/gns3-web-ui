import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { MatCheckboxModule, MatExpansionModule } from "@angular/material";
import { FormsModule } from "@angular/forms";
import { SettingsService } from "../shared/services/settings.service";
import { PersistenceModule } from "angular-persistence";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatExpansionModule, MatCheckboxModule, FormsModule,
        PersistenceModule, BrowserAnimationsModule ],
      providers: [ SettingsService ],
      declarations: [ SettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
