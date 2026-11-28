import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { Controller } from '@models/controller';
import { StartupMediaProfilesService } from '@services/startup-media-profiles.service';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StartupMediaProfileSelectComponent } from './startup-media-profile-select.component';

const CATALOG = [
  {
    id: 'cisco-c8000v-autonomous',
    title: 'Cisco Catalyst 8000v (autonomous)',
    device_type: 'cisco_ios_telnet',
    description: 'Day-0 config from a CD-ROM',
  },
  { id: 'cisco-viptela', title: 'Cisco Viptela', device_type: 'cisco_viptela', description: 'NoCloud seed' },
];

describe('StartupMediaProfileSelectComponent', () => {
  let fixture: ComponentFixture<StartupMediaProfileSelectComponent>;
  let loader: HarnessLoader;
  let list: ReturnType<typeof vi.fn<StartupMediaProfilesService['list']>>;
  const controller = { id: 1 } as Controller;

  async function create({
    value = '',
    deviceType,
    disabled = false,
  }: {
    value?: string;
    deviceType?: string;
    disabled?: boolean;
  } = {}) {
    TestBed.configureTestingModule({
      imports: [StartupMediaProfileSelectComponent],
      providers: [{ provide: StartupMediaProfilesService, useValue: { list } }],
    });
    fixture = TestBed.createComponent(StartupMediaProfileSelectComponent);
    fixture.componentRef.setInput('controller', controller);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('deviceType', deviceType);
    fixture.componentRef.setInput('disabled', disabled);
    fixture.detectChanges();
    await fixture.whenStable();
    loader = TestbedHarnessEnvironment.loader(fixture);
  }

  beforeEach(() => {
    list = vi.fn<StartupMediaProfilesService['list']>(() => of(CATALOG));
  });

  it.each([
    {
      label: 'no device type',
      deviceType: '',
      value: '',
      profiles: CATALOG,
      selected: 'Console (default)',
      selectedValue: '',
    },
    {
      label: 'incompatible selection',
      deviceType: 'cisco_xe',
      value: CATALOG[1].id,
      profiles: [CATALOG[0]],
      selected: 'Console (default)',
      selectedValue: '',
    },
    {
      label: 'compatible selection',
      deviceType: 'cisco_viptela',
      value: CATALOG[1].id,
      profiles: [CATALOG[1]],
      selected: CATALOG[1].title,
      selectedValue: CATALOG[1].id,
    },
  ])(
    'shows available profiles and selection for $label',
    async ({ deviceType, value, profiles, selected, selectedValue }) => {
      await create({ deviceType, value });
      expect(list).toHaveBeenCalledExactlyOnceWith(controller);
      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      expect(await Promise.all(options.map((option) => option.getText()))).toEqual([
        'Console (default)',
        ...profiles.map((profile) => profile.title),
      ]);
      expect(await select.getValueText()).toBe(selected);
      expect(fixture.componentInstance.value()).toBe(selectedValue);
    },
  );

  it('uses the new controller catalog when the old request completes late', async () => {
    const oldCatalog = new Subject<typeof CATALOG>();
    const otherController = { id: 2 } as Controller;
    list.mockReturnValueOnce(oldCatalog).mockReturnValueOnce(of([CATALOG[0]]));
    await create({ value: 'cisco-viptela', deviceType: 'cisco_xe' });
    fixture.componentRef.setInput('controller', otherController);
    fixture.detectChanges();
    await fixture.whenStable();

    oldCatalog.next(CATALOG);
    fixture.detectChanges();
    expect(list).toHaveBeenLastCalledWith(otherController);
    expect(fixture.componentInstance.profiles()).toEqual([CATALOG[0]]);
    expect(fixture.componentInstance.value()).toBe('cisco-viptela');
  });

  it('writes the chosen profile id to the value', async () => {
    await create();
    const select = await loader.getHarness(MatSelectHarness);
    await select.clickOptions({ text: 'Cisco Viptela' });
    expect(fixture.componentInstance.value()).toBe('cisco-viptela');
  });

  it('clears the value when Console is chosen again', async () => {
    await create({ value: 'cisco-viptela' });
    const select = await loader.getHarness(MatSelectHarness);
    expect(await select.getValueText()).toBe('Cisco Viptela');
    await select.clickOptions({ text: 'Console (default)' });
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('shows no hint under the field', async () => {
    await create({ value: 'cisco-viptela' });
    expect(fixture.nativeElement.querySelector('mat-hint')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-label').textContent).toContain('Startup configuration profile');
  });

  it('can be disabled', async () => {
    await create({ disabled: true });
    expect(await (await loader.getHarness(MatSelectHarness)).isDisabled()).toBe(true);
  });

  it('keeps a profile the catalog does not list selectable', async () => {
    await create({ value: 'future-profile' });
    const select = await loader.getHarness(MatSelectHarness);
    expect(await select.getValueText()).toBe('future-profile');
  });

  it.each([
    ['cisco-viptela', 'cisco-viptela'],
    ['', 'Console (default)'],
  ])('shows a read-only value and a note when the catalog fails (%j)', async (value, label) => {
    list.mockReturnValue(throwError(() => new Error('down')));
    await create({ value });
    expect(fixture.componentInstance.state()).toBe('unavailable');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe(label);
    expect(fixture.nativeElement.querySelector('[role="note"]').textContent).toContain('could not be loaded');
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
  });
});
