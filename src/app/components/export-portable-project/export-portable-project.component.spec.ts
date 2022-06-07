import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportPortableProjectComponent } from './export-portable-project.component';

describe('ExportPortableProjectComponent', () => {
  let component: ExportPortableProjectComponent;
  let fixture: ComponentFixture<ExportPortableProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportPortableProjectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportPortableProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
