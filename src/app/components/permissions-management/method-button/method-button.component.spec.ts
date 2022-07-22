import {async, fakeAsync, TestBed} from "@angular/core/testing";
import {MethodButtonComponent} from "@components/permissions-management/method-button/method-button.component";
import {Methods} from "@models/api/permission";

describe('MethodButtonComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({declarations: [MethodButtonComponent]});
  }));

  it('Should set text color to green when button is enable', fakeAsync(() => {
      const fixture = TestBed.createComponent(MethodButtonComponent);
      const component = fixture.componentInstance;
      const debugElement = fixture.debugElement;

      component.enable = true;

      fixture.detectChanges();

      expect(debugElement.nativeElement.querySelector('button').classList).toContain('enable');

  }));

  it('Should switch to enable on button click', (() => {
    const fixture = TestBed.createComponent(MethodButtonComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.enable = false;
    component.change();

    expect(component.enable).toEqual(true);

  }));


  it('Should emit event enable on button click', (() => {
    const fixture = TestBed.createComponent(MethodButtonComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.update.subscribe((data) => {
        expect(data.enable).toEqual(true);
        expect(data.name).toEqual(Methods.GET);
    });

    component.name = Methods.GET;
    component.enable = false;
    component.change();

  }));


});
