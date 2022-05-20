import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadingProcessbarComponent } from './uploading-processbar.component';

describe('UploadingProcessbarComponent', () => {
  let component: UploadingProcessbarComponent;
  let fixture: ComponentFixture<UploadingProcessbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadingProcessbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadingProcessbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
