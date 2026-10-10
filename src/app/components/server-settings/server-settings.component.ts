import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Subscription } from 'rxjs';

import { Controller } from '@models/controller';
import {
  SECRET_MASK,
  ServerSettings,
  ServerSettingsSectionName,
  SettingsUpdatedEvent,
} from '@models/server-settings/server-settings';
import {
  SETTINGS_METADATA,
  SettingsFieldMeta,
  SettingsGroupMeta,
  SettingsSectionMeta,
  SettingsFieldValue,
} from '@models/server-settings/settings-metadata';
import { SettingsSectionSchemas, enrichSettingsMetadata } from '@models/server-settings/settings-schema';
import { SecretState, buildSettingsUpdate, collectDirtyKeys, fieldId, valuesEqual } from './settings-diff';
import { ControllerService } from '@services/controller.service';
import { NotificationService } from '@services/notification.service';
import { ServerSettingsService } from '@services/server-settings.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrl: './server-settings.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSettingsComponent implements OnInit, OnDestroy {
  // Compiled skeleton until the server's OpenAPI document arrives, then the
  // same skeleton with server-truth hints, defaults, bounds and enum choices.
  readonly sections = computed<SettingsSectionMeta[]>(() => {
    const schemas = this.sectionSchemas();
    return schemas ? enrichSettingsMetadata(SETTINGS_METADATA, schemas) : SETTINGS_METADATA;
  });
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  private route = inject(ActivatedRoute);
  private cd = inject(ChangeDetectorRef);
  private controllerService = inject(ControllerService);
  private serverSettingsService = inject(ServerSettingsService);
  private notificationService = inject(NotificationService);
  private toaster = inject(ToasterService);

  private controller: Controller | undefined;
  private initialValues: ServerSettings | null = null;
  private subscriptions = new Subscription();

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly activeSection = signal<ServerSettingsSectionName>('Server');
  readonly sectionSchemas = signal<SettingsSectionSchemas | null>(null);
  readonly formValues = signal<ServerSettings | null>(null);
  readonly pendingRemoves = signal<ReadonlySet<string>>(new Set());
  readonly secrets = signal<Record<string, SecretState>>({});
  readonly serverError = signal<{ status: number; message: string } | null>(null);
  readonly restartBanner = signal<string[] | null>(null);
  readonly externalChange = signal(false);
  readonly searchQuery = signal('');
  readonly hasSearch = computed(() => this.searchQuery().trim().length > 0);
  private readonly groupExpansion = signal<ReadonlyMap<string, boolean>>(new Map());
  private readonly collapsedSearchGroups = signal<ReadonlySet<string>>(new Set());

  readonly matchingFields = computed<ReadonlySet<string>>(() => {
    const terms = this.searchQuery().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = new Set<string>();
    for (const section of this.sections()) {
      for (const group of section.groups) {
        for (const field of group.fields) {
          const text = [
            section.label,
            group.label,
            group.summary,
            field.label,
            field.key,
            field.key.replace(/_/g, ' '),
            field.hint,
          ]
            .join(' ')
            .toLowerCase();
          if (terms.every((term) => text.includes(term))) {
            matches.add(fieldId(section.name, field.key));
          }
        }
      }
    }
    return matches;
  });

  readonly matchingSections = computed(() => this.sections().filter((section) => this.sectionMatchCount(section) > 0));

  readonly activeSectionMeta = computed<SettingsSectionMeta | undefined>(() => {
    const sections = this.hasSearch() ? this.matchingSections() : this.sections();
    return sections.find((section) => section.name === this.activeSection()) ?? sections[0];
  });

  readonly dirtyKeys = computed<ReadonlySet<string>>(() => {
    const form = this.formValues();
    if (!form || !this.initialValues) {
      return new Set();
    }
    return collectDirtyKeys(this.sections(), this.initialValues, form, this.pendingRemoves(), this.secrets());
  });

  readonly isDirty = computed(() => this.dirtyKeys().size > 0);
  readonly restartChangeCount = computed(() =>
    this.sections().reduce(
      (count, section) =>
        count +
        section.groups.reduce(
          (total, group) =>
            total + group.fields.filter((field) => field.restartRequired && this.isFieldDirty(section, field)).length,
          0
        ),
      0
    )
  );
  readonly allGroupsExpanded = computed(() => {
    const section = this.activeSectionMeta();
    const groups = section?.groups.filter((group) => this.groupMatches(group, section)) ?? [];
    return groups.length > 0 && groups.every((group) => this.isGroupExpanded(section, group));
  });

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
    this.collapsedSearchGroups.set(new Set());
  }

  fieldMatches(section: SettingsSectionMeta, field: SettingsFieldMeta): boolean {
    return this.matchingFields().has(fieldId(section.name, field.key));
  }

  groupMatches(group: SettingsGroupMeta, section: SettingsSectionMeta): boolean {
    return group.fields.some((field) => this.fieldMatches(section, field));
  }

  sectionMatchCount(section: SettingsSectionMeta): number {
    return section.groups.reduce(
      (count, group) => count + group.fields.filter((field) => this.fieldMatches(section, field)).length,
      0
    );
  }

  groupChangeCount(section: SettingsSectionMeta, group: SettingsGroupMeta): number {
    return group.fields.filter((field) => this.isFieldDirty(section, field)).length;
  }

  sectionChangeCount(section: SettingsSectionMeta): number {
    return section.groups.reduce((count, group) => count + this.groupChangeCount(section, group), 0);
  }

  isGroupExpanded(section: SettingsSectionMeta, group: SettingsGroupMeta): boolean {
    const id = fieldId(section.name, group.id);
    if (this.hasSearch()) {
      return !this.collapsedSearchGroups().has(id);
    }
    return (
      this.groupExpansion().get(id) ??
      (section.name === 'Server'
        ? group.id === 'general' || group.id === 'network'
        : group.id === section.groups[0]?.id)
    );
  }

  toggleGroup(section: SettingsSectionMeta, group: SettingsGroupMeta) {
    this.setGroupExpanded(section, group, !this.isGroupExpanded(section, group));
  }

  toggleAllGroups() {
    const section = this.activeSectionMeta();
    if (!section) return;
    const expanded = !this.allGroupsExpanded();
    for (const group of section.groups) {
      if (this.groupMatches(group, section)) this.setGroupExpanded(section, group, expanded);
    }
  }

  private setGroupExpanded(section: SettingsSectionMeta, group: SettingsGroupMeta, expanded: boolean) {
    const id = fieldId(section.name, group.id);
    if (this.hasSearch()) {
      const next = new Set(this.collapsedSearchGroups());
      if (expanded) next.delete(id);
      else next.add(id);
      this.collapsedSearchGroups.set(next);
    } else {
      this.groupExpansion.set(new Map(this.groupExpansion()).set(id, expanded));
    }
  }

  ngOnInit() {
    const controllerId = this.route.snapshot.paramMap.get('controller_id');
    const id = parseInt(controllerId ?? '', 10);
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set('Invalid controller identifier');
      this.isLoading.set(false);
      return;
    }

    this.controllerService.get(id).then(
      (controller: Controller) => {
        this.controller = controller;
        this.loadSettings();
        this.loadSchema();
      },
      () => {
        this.loadError.set('Failed to load the controller');
        this.isLoading.set(false);
        this.cd.markForCheck();
      }
    );

    this.subscriptions.add(
      this.notificationService.serverSettingsNotificationEmitter.subscribe((notification) =>
        this.onSettingsUpdated(notification.event)
      )
    );
    this.subscriptions.add(
      this.notificationService.wsReconnected.subscribe(() => {
        // The notification stream does not replay events missed while
        // disconnected — resync unless the user has unsaved edits.
        if (!this.isDirty()) {
          this.refetchSettings(true);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): boolean {
    return !this.isDirty();
  }

  selectSection(name: ServerSettingsSectionName) {
    this.activeSection.set(name);
  }

  isFieldDirty(section: SettingsSectionMeta, field: SettingsFieldMeta): boolean {
    return this.dirtyKeys().has(fieldId(section.name, field.key));
  }

  // Template accessors — indexing the section union with a plain string key
  // would not type-check, so reads go through these helpers.
  valueOf(section: SettingsSectionMeta, field: SettingsFieldMeta): SettingsFieldValue {
    const form = this.formValues();
    if (!form) {
      return null;
    }
    return (form[section.name] as unknown as Record<string, SettingsFieldValue>)[field.key] ?? null;
  }

  listValueOf(section: SettingsSectionMeta, field: SettingsFieldMeta): string[] {
    const value = this.valueOf(section, field);
    return Array.isArray(value) ? value : [];
  }

  canRevert(section: SettingsSectionMeta, field: SettingsFieldMeta): boolean {
    if (field.type === 'secret' || field.defaultValue === undefined) {
      return false;
    }
    const form = this.formValues();
    return !!form && !valuesEqual(form[section.name][field.key], field.defaultValue);
  }

  resettableFields(section: SettingsSectionMeta, group: SettingsGroupMeta): SettingsFieldMeta[] {
    return group.fields.filter(
      (field) => this.fieldMatches(section, field) && (this.canRevert(section, field) || field.type === 'secret')
    );
  }

  revertField(section: SettingsSectionMeta, field: SettingsFieldMeta) {
    const id = fieldId(section.name, field.key);
    if (field.type === 'secret') {
      this.toggleSecretClear(id);
      return;
    }
    if (field.defaultValue === undefined) {
      return;
    }
    this.setValue(section.name, field.key, field.defaultValue);
    this.addPendingRemove(id);
  }

  setValue(section: ServerSettingsSectionName, key: string, value: SettingsFieldValue) {
    const form = this.formValues();
    if (!form) {
      return;
    }
    this.formValues.set({ ...form, [section]: { ...form[section], [key]: value } });
    // Editing a reverted field cancels the pending removal — the normal value
    // diff applies from now on.
    this.removePendingRemove(fieldId(section, key));
  }

  onNumberInput(section: SettingsSectionMeta, field: SettingsFieldMeta, event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '') {
      this.setValue(section.name, field.key, null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      this.setValue(section.name, field.key, parsed);
    }
  }

  onTextInput(section: SettingsSectionMeta, field: SettingsFieldMeta, event: Event) {
    this.setValue(section.name, field.key, (event.target as HTMLInputElement).value);
  }

  onSecretInput(section: SettingsSectionMeta, field: SettingsFieldMeta, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.setSecret(fieldId(section.name, field.key), value ? { state: 'set', value } : { state: 'unchanged' });
  }

  secretState(section: SettingsSectionMeta, field: SettingsFieldMeta): SecretState {
    return this.secrets()[fieldId(section.name, field.key)] ?? { state: 'unchanged' };
  }

  secretInputValue(section: SettingsSectionMeta, field: SettingsFieldMeta): string {
    const state = this.secretState(section, field);
    return state.state === 'set' ? state.value : '';
  }

  secretIsSet(section: SettingsSectionMeta, field: SettingsFieldMeta): boolean {
    const form = this.formValues();
    return !!form && form[section.name][field.key] === SECRET_MASK;
  }

  toggleSecretClear(id: string) {
    const state = this.secrets()[id] ?? { state: 'unchanged' };
    this.setSecret(id, state.state === 'clear' ? { state: 'unchanged' } : { state: 'clear' });
  }

  private setSecret(id: string, state: SecretState) {
    this.secrets.set({ ...this.secrets(), [id]: state });
  }

  addListItem(section: SettingsSectionMeta, field: SettingsFieldMeta, event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    const form = this.formValues();
    if (value && form) {
      const current = form[section.name][field.key] as string[];
      this.setValue(section.name, field.key, [...current, value]);
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeListItem(section: SettingsSectionMeta, field: SettingsFieldMeta, item: string) {
    const form = this.formValues();
    if (!form) {
      return;
    }
    const current = form[section.name][field.key] as string[];
    this.setValue(
      section.name,
      field.key,
      current.filter((entry) => entry !== item)
    );
  }

  save() {
    const form = this.formValues();
    if (!this.controller || !this.initialValues || !form) {
      return;
    }
    const payload = buildSettingsUpdate(
      this.sections(),
      this.initialValues,
      form,
      this.pendingRemoves(),
      this.secrets()
    );
    if (!Object.keys(payload).length) {
      return;
    }

    this.isSaving.set(true);
    this.serverError.set(null);
    this.serverSettingsService.updateServerSettings(this.controller, payload).subscribe({
      next: (response) => {
        this.applyLoadedSettings(response);
        this.isSaving.set(false);
        this.externalChange.set(false);
        this.restartBanner.set(response.restart_required.length ? response.restart_required : null);
        this.toaster.success('Server settings saved');
        this.cd.markForCheck();
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  discardChanges() {
    if (this.initialValues) {
      this.applyLoadedSettings(this.initialValues);
    }
    this.serverError.set(null);
    this.externalChange.set(false);
  }

  retryLoad() {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.loadSettings();
  }

  private loadSettings() {
    if (!this.controller) {
      return;
    }
    this.serverSettingsService.getServerSettings(this.controller).subscribe({
      next: (settings) => {
        this.applyLoadedSettings(settings);
        this.isLoading.set(false);
        this.loadError.set(null);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load server settings';
        this.isLoading.set(false);
        this.loadError.set(message);
        this.cd.markForCheck();
      },
    });
  }

  // Enrichment never blocks or breaks the form: failures resolve to null and
  // the compiled metadata keeps driving the page.
  private loadSchema() {
    if (!this.controller) {
      return;
    }
    this.subscriptions.add(
      this.serverSettingsService.getSettingsSchemas(this.controller).subscribe((schemas) => {
        this.sectionSchemas.set(schemas);
        this.cd.markForCheck();
      })
    );
  }

  private refetchSettings(silent: boolean) {
    if (!this.controller) {
      return;
    }
    this.serverSettingsService.getServerSettings(this.controller).subscribe({
      next: (settings) => {
        this.applyLoadedSettings(settings);
        this.cd.markForCheck();
      },
      error: (err) => {
        if (!silent) {
          const message = err.error?.message || err.message || 'Failed to load server settings';
          this.toaster.error(message);
          this.cd.markForCheck();
        }
      },
    });
  }

  private applyLoadedSettings(settings: ServerSettings) {
    this.initialValues = structuredClone(settings);
    this.formValues.set(settings);
    this.pendingRemoves.set(new Set());
    this.secrets.set({});
  }

  private onSettingsUpdated(event: SettingsUpdatedEvent) {
    if (this.isDirty()) {
      this.externalChange.set(true);
      this.toaster.warning(
        'Server settings were changed by another session. Review your unsaved changes before saving.'
      );
    } else {
      if (event.restart_required.length && !this.restartBanner()) {
        this.restartBanner.set(event.restart_required);
      }
      this.refetchSettings(true);
    }
    this.cd.markForCheck();
  }

  private handleSaveError(err: any) {
    this.isSaving.set(false);
    const status = err?.originalError?.status ?? err?.status;
    const message = err.error?.message || err.message || 'Failed to save server settings';
    if (status === 400 || status === 409) {
      const text = status === 409 ? `Some options are managed by another configuration file: ${message}` : message;
      this.serverError.set({ status, message: text });
      this.toaster.error(text);
    } else if (status === 403) {
      this.toaster.error('You do not have permission to modify server settings');
    } else {
      this.toaster.error(message);
    }
    this.cd.markForCheck();
  }

  private addPendingRemove(id: string) {
    const next = new Set(this.pendingRemoves());
    next.add(id);
    this.pendingRemoves.set(next);
  }

  private removePendingRemove(id: string) {
    if (!this.pendingRemoves().has(id)) {
      return;
    }
    const next = new Set(this.pendingRemoves());
    next.delete(id);
    this.pendingRemoves.set(next);
  }
}
