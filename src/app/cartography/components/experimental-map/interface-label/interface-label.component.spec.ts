import { ChangeDetectorRef, ElementRef, Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CssFixer } from 'app/cartography/helpers/css-fixer';
import { InterfaceLabelComponent } from './interface-label.component';

export class MockElementRef extends ElementRef {
  constructor() { super(null || undefined); }
  nativeElement={}
}


xdescribe('InterfaceLabelComponent', () => {
  let component: InterfaceLabelComponent;
  let fixture: ComponentFixture<InterfaceLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterfaceLabelComponent],
      providers: [
        CssFixer,
        ChangeDetectorRef,
        { provide: ElementRef, useValue: new MockElementRef() },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterfaceLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy()
  });
});
