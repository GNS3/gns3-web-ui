// Pure diff helpers for the server settings form: compare the loaded values
// against the edited ones and build the partial PUT payload. Secrets never
// travel through the form value — they are tracked separately in three states
// (unchanged / set / clear) because the API treats the GET mask and an empty
// string as "leave unchanged" and null as "remove the option".

import {
  ServerSettings,
  ServerSettingsUpdate,
} from '@models/server-settings/server-settings';
import {
  SettingsFieldMeta,
  SettingsFieldValue,
  SettingsSectionMeta,
} from '@models/server-settings/settings-metadata';

export type SecretState = { state: 'unchanged' } | { state: 'set'; value: string } | { state: 'clear' };

export type SecretStates = Record<string, SecretState>;

export function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export function valuesEqual(a: SettingsFieldValue, b: SettingsFieldValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return arraysEqual(a, b);
  }
  return a === b;
}

export function fieldId(section: string, key: string): string {
  return `${section}.${key}`;
}

/** Fields of every group in a section, flattened (lib es2018 has no Array.flatMap). */
function sectionFields(section: SettingsSectionMeta): SettingsFieldMeta[] {
  return section.groups.reduce<SettingsFieldMeta[]>((fields, group) => fields.concat(group.fields), []);
}

function clamp(value: number, min?: number, max?: number): number {
  let clamped = value;
  if (min !== undefined && clamped < min) {
    clamped = min;
  }
  if (max !== undefined && clamped > max) {
    clamped = max;
  }
  return clamped;
}

// Normalize an edited value before it goes on the wire: numeric fields are
// coerced and clamped to their metadata range.
function normalize(field: { type: string; min?: number; max?: number }, value: SettingsFieldValue): SettingsFieldValue {
  if ((field.type === 'int' || field.type === 'float') && value !== null && value !== '') {
    return clamp(Number(value), field.min, field.max);
  }
  return value;
}

/**
 * 'Section.option' ids of everything that differs from the loaded values,
 * is pending removal (revert-to-default) or has a secret in a non-unchanged
 * state.
 */
export function collectDirtyKeys(
  metadata: SettingsSectionMeta[],
  initial: ServerSettings,
  current: ServerSettings,
  pendingRemoves: ReadonlySet<string>,
  secrets: SecretStates,
): Set<string> {
  const dirty = new Set<string>();
  for (const section of metadata) {
    for (const field of sectionFields(section)) {
      const id = fieldId(section.name, field.key);
      if (field.type === 'secret') {
        if (secrets[id] && secrets[id].state !== 'unchanged') {
          dirty.add(id);
        }
        continue;
      }
      if (pendingRemoves.has(id)) {
        dirty.add(id);
        continue;
      }
      const before = initial[section.name][field.key];
      const after = current[section.name][field.key];
      if (!valuesEqual(before, after)) {
        dirty.add(id);
      }
    }
  }
  return dirty;
}

/**
 * Build the partial PUT payload: only changed options are submitted, options
 * marked for revert are sent as null (removing them from the configuration
 * file), secrets follow their three states. Empty sections are omitted.
 */
export function buildSettingsUpdate(
  metadata: SettingsSectionMeta[],
  initial: ServerSettings,
  current: ServerSettings,
  pendingRemoves: ReadonlySet<string>,
  secrets: SecretStates,
): ServerSettingsUpdate {
  const update: ServerSettingsUpdate = {};
  for (const section of metadata) {
    for (const field of sectionFields(section)) {
      const id = fieldId(section.name, field.key);
      let value: SettingsFieldValue | undefined;

      if (field.type === 'secret') {
        const state = secrets[id];
        if (!state || state.state === 'unchanged') {
          continue;
        }
        value = state.state === 'clear' ? null : state.value;
      } else if (pendingRemoves.has(id)) {
        value = null;
      } else {
        const before = initial[section.name][field.key];
        const after = current[section.name][field.key];
        if (valuesEqual(before, after)) {
          continue;
        }
        value = normalize(field, after);
      }

      if (!update[section.name]) {
        update[section.name] = {};
      }
      update[section.name][field.key] = value;
    }
  }
  return update;
}
