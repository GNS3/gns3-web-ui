import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerSettingsComponent } from './server-settings.component';
import { SETTINGS_METADATA } from '@models/server-settings/settings-metadata';
import { SECRET_MASK, ServerSettings } from '@models/server-settings/server-settings';
import { ControllerService } from '@services/controller.service';
import { ServerSettingsService } from '@services/server-settings.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';

function baseSettings(): ServerSettings {
  const values = Object.fromEntries(
    SETTINGS_METADATA.map((section) => [
      section.name,
      Object.fromEntries(
        section.groups.flatMap((group) =>
          group.fields.map((field) => [field.key, structuredClone(field.defaultValue ?? null)])
        )
      ),
    ])
  );
  return {
    ...values,
    restart_required: [],
    Server: {
      ...values['Server'],
      name: 'GNS3 controller',
      compute_password: SECRET_MASK,
    },
  } as unknown as ServerSettings;
}

describe('ServerSettingsComponent settings workspace', () => {
  let fixture: ComponentFixture<ServerSettingsComponent>;
  let component: ServerSettingsComponent;
  let service: { updateServerSettings: ReturnType<typeof vi.fn> };
  let settings: ServerSettings;
  const controller = { id: 1, name: 'GNS3', host: 'localhost', port: 3080, protocol: 'http:' };
  const section = (name = 'Server') => component.sections().find((item) => item.name === name)!;
  const group = (id: string, name = 'Server') => section(name).groups.find((item) => item.id === id)!;
  const field = (key: string, name = 'Server') =>
    section(name)
      .groups.flatMap((item) => item.fields)
      .find((item) => item.key === key)!;
  const input = (key: string, name = 'Server') =>
    fixture.nativeElement.querySelector(`[data-setting="${name}.${key}"] input`) as HTMLInputElement;
  const type = async (key: string, value: string, name = 'Server') => {
    const element = input(key, name);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    return element;
  };

  beforeEach(async () => {
    // The shared test setup fakes timers; real timers let zoneless DOM events settle.
    vi.useRealTimers();
    settings = baseSettings();
    service = { updateServerSettings: vi.fn().mockReturnValue(of(structuredClone(settings))) };
    await TestBed.configureTestingModule({
      imports: [ServerSettingsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: ControllerService, useValue: { get: vi.fn().mockResolvedValue(controller) } },
        {
          provide: ServerSettingsService,
          useValue: {
            ...service,
            getServerSettings: () => of(structuredClone(settings)),
            getSettingsSchemas: () => of(null),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            serverSettingsNotificationEmitter: new Subject(),
            wsReconnected: new Subject(),
          },
        },
        { provide: ToasterService, useValue: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    // Let zoneless change detection render signal updates before checking the DOM.
    fixture = TestBed.createComponent(ServerSettingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('initially opens General and Network/Security and collapses the advanced Server groups', () => {
    expect(component.isGroupExpanded(section(), group('general'))).toBe(true);
    expect(component.isGroupExpanded(section(), group('network'))).toBe(true);
    expect(component.isGroupExpanded(section(), group('paths'))).toBe(false);
    const button = fixture.nativeElement.querySelector('#server-settings-heading-Server-paths');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#' + button.getAttribute('aria-controls')).hidden).toBe(true);
  });

  it('expands a group through its native button and retains its input when closed', async () => {
    const original = input('images_path');
    const button = fixture.nativeElement.querySelector('#server-settings-heading-Server-paths') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(component.isGroupExpanded(section(), group('paths'))).toBe(true);
    button.click();
    await fixture.whenStable();
    expect(input('images_path')).toBe(original);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('expands/collapses all groups and remembers independent category expansion', () => {
    component.toggleAllGroups();
    expect(section().groups.every((item) => component.isGroupExpanded(section(), item))).toBe(true);
    component.selectSection('Qemu');
    component.toggleGroup(section('Qemu'), group('advanced', 'Qemu'));
    component.selectSection('Server');
    component.toggleAllGroups();
    expect(section().groups.every((item) => !component.isGroupExpanded(section(), item))).toBe(true);
    expect(component.isGroupExpanded(section('Qemu'), group('advanced', 'Qemu'))).toBe(true);
  });

  it('searches labels and keys case-insensitively across all categories', () => {
    component.setSearchQuery('JWT_ACCESS_TOKEN');
    expect(component.activeSectionMeta()?.name).toBe('Controller');
    expect([...component.matchingFields()]).toEqual(['Controller.jwt_access_token_expire_minutes']);
    component.setSearchQuery('hardware acceleration');
    expect(component.activeSectionMeta()?.name).toBe('Qemu');
    expect(component.matchingFields().size).toBe(2);
    component.setSearchQuery('console ports');
    expect(component.matchingFields().has('Server.console_start_port_range')).toBe(true);
  });

  it('filters through the search input and returns focus to it when cleared', async () => {
    const search = fixture.nativeElement.querySelector('.server-settings__search input') as HTMLInputElement;
    search.value = 'jwt';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(component.activeSectionMeta()?.name).toBe('Controller');
    const clear = fixture.nativeElement.querySelector('[aria-label="Clear settings search"]') as HTMLButtonElement;
    clear.click();
    await fixture.whenStable();
    expect(component.hasSearch()).toBe(false);
    expect(search.value).toBe('');
    expect(document.activeElement).toBe(search);
  });

  it('searches live schema descriptions and requires all search terms', () => {
    component.sectionSchemas.set({
      Server: { default_nat_interface: { description: 'Uses libvirt bridge networking' } },
    });
    component.setSearchQuery('libvirt bridge');
    expect([...component.matchingFields()]).toEqual(['Server.default_nat_interface']);
    component.setSearchQuery('libvirt missing-word');
    expect(component.matchingFields().size).toBe(0);
  });

  it('opens matches while searching and restores prior category and group state on clear', () => {
    component.toggleGroup(section(), group('general'));
    component.setSearchQuery('MCP');
    expect(component.isGroupExpanded(section(), group('mcp'))).toBe(true);
    component.toggleGroup(section(), group('mcp'));
    expect(component.isGroupExpanded(section(), group('mcp'))).toBe(false);
    component.setSearchQuery('MCP allowed');
    expect(component.isGroupExpanded(section(), group('mcp'))).toBe(true);
    component.setSearchQuery('jwt');
    expect(component.activeSectionMeta()?.name).toBe('Controller');
    component.setSearchQuery('');
    expect(component.activeSectionMeta()?.name).toBe('Server');
    expect(component.isGroupExpanded(section(), group('general'))).toBe(false);
    expect(component.isGroupExpanded(section(), group('mcp'))).toBe(false);
  });

  it('renders a clear zero-results state while keeping actions and pending edits available', async () => {
    await type('port', '3081');
    component.setSearchQuery('no-such-setting-12345');
    // Direct method calls need an explicit render before checking the DOM.
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.server-settings__empty').textContent).toContain('No settings match');
    expect(component.activeSectionMeta()).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.server-settings__unsaved-status').textContent).toContain(
      '1 unsaved change'
    );
    const clear = fixture.nativeElement.querySelector('.server-settings__empty button') as HTMLButtonElement;
    clear.click();
    await fixture.whenStable();
    expect(input('port').value).toBe('3081');
    expect(component.hasSearch()).toBe(false);
  });

  it('retains typed text and the same control through search, collapse, and category switches', async () => {
    const original = await type('name', 'Edited controller');
    component.toggleGroup(section(), group('general'));
    component.setSearchQuery('jwt');
    await fixture.whenStable();
    component.setSearchQuery('');
    component.selectSection('Controller');
    await fixture.whenStable();
    component.selectSection('Server');
    component.toggleGroup(section(), group('general'));
    await fixture.whenStable();
    expect(input('name')).toBe(original);
    expect(input('name').value).toBe('Edited controller');
    expect(component.dirtyKeys().has('Server.name')).toBe(true);
  });

  it('retains pending secrets across hidden groups/categories and excludes their values from search', async () => {
    const original = await type('compute_password', 'private-test-value');
    component.setSearchQuery('private-test-value');
    expect(component.matchingFields().size).toBe(0);
    component.setSearchQuery('jwt');
    await fixture.whenStable();
    component.setSearchQuery('');
    await fixture.whenStable();
    expect(input('compute_password')).toBe(original);
    expect(original.value).toBe('private-test-value');
    expect(component.secretInputValue(section(), field('compute_password'))).toBe('private-test-value');
  });

  it('counts hidden changes once, including secret replacements and resets', async () => {
    await type('port', '3081');
    await type('name', 'Edited controller');
    await type('compute_password', 'replacement');
    component.revertField(section(), field('host'));
    component.setSearchQuery('jwt');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.dirtyKeys().size).toBe(4);
    expect(component.restartChangeCount()).toBe(2);
    expect(component.groupChangeCount(section(), group('network'))).toBe(2);
    expect(component.sectionChangeCount(section())).toBe(4);
    expect(fixture.nativeElement.querySelector('.server-settings__restart-summary').textContent).toContain(
      '2 require restart'
    );
  });

  it('resets only the selected setting from the header menu without collapsing its group', async () => {
    await type('port', '3081');
    await type('host', '127.0.0.1');
    const header = fixture.nativeElement.querySelector('#server-settings-heading-Server-network').parentElement
      .parentElement;
    expect(header.querySelector('.server-settings__group-reset')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-setting="Server.port"] button')).toBeNull();
    header.querySelector('.server-settings__group-reset').click();
    await fixture.whenStable();
    const reset = document.querySelector('[aria-label="Reset Listen port to default"]') as HTMLButtonElement;
    expect(reset).not.toBeNull();
    reset.click();
    await fixture.whenStable();
    expect(input('port').value).toBe('3080');
    expect(input('host').value).toBe('127.0.0.1');
    expect(component.pendingRemoves().has('Server.port')).toBe(true);
    expect(component.pendingRemoves().has('Server.host')).toBe(false);
    expect(component.isGroupExpanded(section(), group('network'))).toBe(true);
  });

  it('resets and undoes a secret reset from the collapsed group header', async () => {
    const header = fixture.nativeElement.querySelector('#server-settings-heading-Server-compute-auth').parentElement
      .parentElement;
    const openMenu = async () => {
      header.querySelector('.server-settings__group-reset').click();
      await fixture.whenStable();
    };
    await openMenu();
    (document.querySelector('[aria-label="Reset Compute password to default"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(component.secretState(section(), field('compute_password')).state).toBe('clear');
    expect(component.isGroupExpanded(section(), group('compute-auth'))).toBe(false);
    await openMenu();
    (document.querySelector('[aria-label="Undo reset for Compute password"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(component.secretState(section(), field('compute_password')).state).toBe('unchanged');
    expect(component.isGroupExpanded(section(), group('compute-auth'))).toBe(false);
  });

  it('limits reset choices to search matches and disables groups with no available resets', async () => {
    component.setValue('Server', 'host', '127.0.0.1');
    component.setValue('Server', 'port', 3081);
    component.setSearchQuery('Listen port');
    await fixture.whenStable();
    expect(component.resettableFields(section(), group('network')).map((item) => item.key)).toEqual(['port']);
    component.setSearchQuery('');
    component.discardChanges();
    await fixture.whenStable();
    const reset = fixture.nativeElement
      .querySelector('#server-settings-heading-Server-images')
      .parentElement.parentElement.querySelector('.server-settings__group-reset') as HTMLButtonElement;
    expect(reset.disabled).toBe(true);
  });

  it('discards both visible and hidden edits and clears displayed secret replacement text', async () => {
    await type('port', '3081');
    await type('compute_password', 'replacement');
    component.setSearchQuery('jwt');
    component.discardChanges();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.dirtyKeys().size).toBe(0);
    expect(component.restartChangeCount()).toBe(0);
    expect(input('port').value).toBe('3080');
    expect(input('compute_password').value).toBe('');
    expect(component.searchQuery()).toBe('jwt');
  });

  it('submits hidden edits using the existing partial-update payload', async () => {
    await type('port', '3081');
    await type('compute_password', 'replacement');
    component.revertField(section(), field('host'));
    component.setSearchQuery('jwt');
    component.save();
    expect(service.updateServerSettings).toHaveBeenCalledWith(controller, {
      Server: { host: null, port: 3081, compute_password: 'replacement' },
    });
    expect(component.isDirty()).toBe(false);
    await fixture.whenStable();
    expect(input('compute_password').value).toBe('');
  });
});
