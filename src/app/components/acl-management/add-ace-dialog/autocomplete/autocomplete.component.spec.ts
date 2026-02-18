import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteComponent } from './autocomplete.component';
import {MatAutocomplete} from "@angular/material/autocomplete";

describe('AutocompleteComponent', () => {
  let component: AutocompleteComponent<any>;
  let fixture: ComponentFixture<AutocompleteComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutocompleteComponent, MatAutocomplete ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
