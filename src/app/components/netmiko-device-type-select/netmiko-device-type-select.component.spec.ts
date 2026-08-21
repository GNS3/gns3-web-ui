import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Controller } from '@models/controller';
import { NetmikoDeviceType } from '@models/netmiko-device-type';
import { NetmikoDeviceTypesService } from '@services/netmiko-device-types.service';
import { NetmikoDeviceTypeSelectComponent } from './netmiko-device-type-select.component';

const DEVICE_TYPES: NetmikoDeviceType[] = [
  { name: 'cisco_ios', telnet: false, custom: false },
  { name: 'cisco_ios_telnet', telnet: true, custom: false },
  { name: 'huawei_vrp', telnet: false, custom: false },
  { name: 'gns3_vpcs_telnet', telnet: true, custom: true },
];

/** The input gets aria-autocomplete="list" only when the matAutocomplete trigger is attached. */
const hasDropdown = (fixture: ComponentFixture<NetmikoDeviceTypeSelectComponent>) =>
  (fixture.nativeElement.querySelector('input') as HTMLInputElement).getAttribute('aria-autocomplete') === 'list';

describe('NetmikoDeviceTypeSelectComponent', () => {
  let fixture: ComponentFixture<NetmikoDeviceTypeSelectComponent>;
  let component: NetmikoDeviceTypeSelectComponent;
  let getDeviceTypes: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getDeviceTypes = vi.fn().mockReturnValue(of({ deviceTypes: DEVICE_TYPES, netmikoVersion: '4.7.0' }));
    TestBed.configureTestingModule({
      imports: [NetmikoDeviceTypeSelectComponent],
      providers: [{ provide: NetmikoDeviceTypesService, useValue: { getDeviceTypes } }],
    }).compileComponents();
    fixture = TestBed.createComponent(NetmikoDeviceTypeSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controller', { id: 1 } as Controller);
    fixture.detectChanges();
  });

  it('loads the list when a controller is set and renders a dropdown input', () => {
    expect(getDeviceTypes).toHaveBeenCalledWith({ id: 1 });
    expect(hasDropdown(fixture)).toBe(true);
  });

  it('renders a plain free-text input (no dropdown) when the list is unavailable', () => {
    getDeviceTypes.mockReturnValue(of({ deviceTypes: null, netmikoVersion: null }));
    component['state'].set('idle');
    component['deviceTypes'].set(null);
    component.load();
    fixture.detectChanges();

    expect(hasDropdown(fixture)).toBe(false);
  });

  it('groups the device types by vendor prefix', () => {
    expect(component.groups().map((g) => g.vendor)).toEqual(['cisco', 'gns3', 'huawei']);
    expect(component.groups()[0].types.map((t) => t.name)).toEqual(['cisco_ios', 'cisco_ios_telnet']);
  });

  it('filters groups by the typed text', () => {
    component.value.set('cisco_ios_telnet');

    const names = component.groups().flatMap((g) => g.types.map((t) => t.name));
    expect(names).toEqual(['cisco_ios_telnet']);
  });

  it('writes free-typed input through to the model (out-of-list values are legal)', () => {
    component.onInput({ target: { value: 'my_custom_driver' } } as never);

    expect(component.value()).toBe('my_custom_driver');
    expect(component.notInList()).toBe(true);
  });

  it('applies a picked option to the model', () => {
    component.onOptionSelected('huawei_vrp');

    expect(component.value()).toBe('huawei_vrp');
    expect(component.notInList()).toBe(false);
  });

  it('marks a pre-filled value that is not in the list', () => {
    fixture.componentRef.setInput('value', 'legacy_type');
    fixture.detectChanges();

    expect(component.value()).toBe('legacy_type');
    expect(component.notInList()).toBe(true);
  });
});
